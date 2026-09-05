/* eslint-disable no-console */
import assert from "node:assert";
import { prisma } from "../src/lib/prisma";
import { salesOrderService } from "../src/services/salesOrder.service";
import { deliveryService } from "../src/services/delivery.service";
import { invoiceService } from "../src/services/invoice.service";
import { backorderService } from "../src/services/backorder.service";
import {
  SalesOrderStatus,
  BackorderStatus,
  InvoiceStatus,
  CompanyUserRole,
} from "@prisma/client";

async function runTests() {
  console.log("Starting invoice and backorder integration tests...");

  // Setup test company, user, and products
  const testUser = await prisma.user.create({
    data: {
      userName: "Test Customer",
      email: `testcustomer_${Date.now()}@example.com`,
      password: "password123",
      role: "USER",
    },
  });

  const testSalesRep = await prisma.user.create({
    data: {
      userName: "Test Sales Rep",
      email: `testrep_${Date.now()}@example.com`,
      password: "password123",
      role: "USER",
    },
  });

  const testCompany = await prisma.company.create({
    data: {
      name: "Test Company Corp",
      ownerId: testSalesRep.id,
      currency: "USD",
      country: "US",
      postalCode: "10001",
      addressLine: "123 Business St",
    },
  });

  await prisma.companyUser.create({
    data: {
      companyId: testCompany.id,
      userId: testSalesRep.id,
      role: CompanyUserRole.ADMIN,
    },
  });

  await prisma.companyUser.create({
    data: {
      companyId: testCompany.id,
      userId: testUser.id,
      role: CompanyUserRole.CUSTOMER,
    },
  });

  const testProductA = await prisma.product.create({
    data: {
      companyId: testCompany.id,
      name: "Widget Pro",
      price: 100.0,
    },
  });

  const testProductB = await prisma.product.create({
    data: {
      companyId: testCompany.id,
      name: "Gadget Mini",
      price: 50.0,
    },
  });

  try {
    // 1. Create Sales Order
    console.log("1. Testing sales order creation...");
    const salesOrder = await salesOrderService.createSalesOrder(
      testCompany.id,
      testSalesRep.id,
      {
        customerId: testUser.id,
        currency: "USD",
        notes: "Urgent order for project X",
        items: [
          {
            productId: testProductA.id,
            orderedQuantity: 10,
            unitPrice: 100.0,
            discount: 50.0, // 50 total discount on 10 widgets
            taxRate: 10.0, // 10% tax
          },
          {
            productId: testProductB.id,
            orderedQuantity: 5,
            unitPrice: 50.0,
            discount: 0.0,
            taxRate: 10.0,
          },
        ],
      },
    );

    assert.ok(salesOrder.id, "Sales order must have an id");
    assert.strictEqual(salesOrder.status, SalesOrderStatus.CONFIRMED);
    assert.strictEqual(salesOrder.items?.length, 2);
    const orderItemA = salesOrder.items!.find((i) => i.productId === testProductA.id)!;
    const orderItemB = salesOrder.items!.find((i) => i.productId === testProductB.id)!;
    assert.ok(orderItemA && orderItemB, "Both order items must exist");
    assert.strictEqual(orderItemA.orderedQuantity, 10);
    assert.strictEqual(orderItemA.deliveredQuantity, 0);
    assert.strictEqual(orderItemA.invoicedQuantity, 0);
    assert.strictEqual(orderItemA.remainingQuantity, 10);
    assert.strictEqual(orderItemB.orderedQuantity, 5);
    console.log("   Sales order created successfully:", salesOrder.orderNo);

    // 2. Partial Delivery: Deliver 6 of 10 for Product A, and 0 of 5 for Product B
    console.log("2. Testing partial delivery and automatic backorder creation...");
    const delivery1 = await deliveryService.createDelivery(
      testCompany.id,
      salesOrder.id,
      {
        trackingNumber: "TRK-001",
        notes: "First partial shipment",
        items: [
          {
            salesOrderItemId: orderItemA.id,
            deliveredQuantity: 6,
          },
        ],
      },
    );

    assert.ok(delivery1.id, "Delivery 1 must have an id");
    assert.strictEqual(delivery1.items?.length, 1);
    assert.strictEqual(delivery1.items![0].deliveredQuantity, 6);

    // Verify backorder was automatically created for remaining quantities
    assert.ok(delivery1.createdBackorder, "Backorder must be automatically created for remaining quantities");
    assert.strictEqual(delivery1.createdBackorder!.status, BackorderStatus.PENDING);
    // Product A remaining = 4, Product B remaining = 5 -> totalRemaining = 9
    assert.strictEqual(delivery1.createdBackorder!.totalQuantity, 9);
    assert.strictEqual(delivery1.createdBackorder!.fulfilledQuantity, 0);
    assert.strictEqual(delivery1.createdBackorder!.remainingQuantity, 9);
    assert.strictEqual(delivery1.createdBackorder!.items?.length, 2);

    const boItemA = delivery1.createdBackorder!.items!.find((i) => i.salesOrderItemId === orderItemA.id);
    const boItemB = delivery1.createdBackorder!.items!.find((i) => i.salesOrderItemId === orderItemB.id);
    assert.ok(boItemA && boItemB, "Backorder must have items for remaining products");
    assert.strictEqual(boItemA!.remainingQuantity, 4);
    assert.strictEqual(boItemB!.remainingQuantity, 5);

    // Verify sales order status is now PARTIALLY_DELIVERED
    const updatedOrderAfterDel1 = await salesOrderService.getOrderById(salesOrder.id, testCompany.id);
    assert.strictEqual(updatedOrderAfterDel1.status, SalesOrderStatus.PARTIALLY_DELIVERED);
    console.log("   Partial delivery created backorder:", delivery1.createdBackorder!.backorderNo);

    // 3. Invoice creation: must ONLY include quantities actually delivered
    console.log("3. Testing invoice creation - only quantities actually delivered...");

    // Test rejection: Attempt to invoice 10 units when only 6 delivered
    let overInvoiceFailed = false;
    try {
      await invoiceService.createInvoice(testCompany.id, {
        salesOrderId: salesOrder.id,
        items: [
          {
            salesOrderItemId: orderItemA.id,
            deliveredQuantity: 10,
          },
        ],
      });
    } catch (err: unknown) {
      overInvoiceFailed = true;
      assert.ok((err as Error).message.includes("Invoices only include quantities actually delivered"));
    }
    assert.strictEqual(overInvoiceFailed, true, "Attempting to invoice undelivered quantities must fail");

    // Valid Invoice from Delivery 1
    const invoice1 = await invoiceService.createInvoice(testCompany.id, {
      deliveryId: delivery1.id,
      paymentTerms: "Net 30",
    });

    assert.ok(invoice1.id, "Invoice 1 must have an id");
    assert.strictEqual(invoice1.status, InvoiceStatus.POSTED);
    assert.strictEqual(invoice1.currency, "USD");
    assert.strictEqual(invoice1.paymentTerms, "Net 30");
    assert.strictEqual(invoice1.items?.length, 1);
    assert.strictEqual(invoice1.items![0].deliveredQuantity, 6);
    assert.strictEqual(invoice1.items![0].unitPrice, 100.0);

    // Product A had 10 ordered, discount = 50. For 6 units, discount = 30.
    // Subtotal = 600. Discount = 30. Taxable = 570. Tax at 10% = 57. Total = 627.
    assert.strictEqual(invoice1.subtotal, 600.0);
    assert.strictEqual(invoice1.discount, 30.0);
    assert.strictEqual(invoice1.tax, 57.0);
    assert.strictEqual(invoice1.total, 627.0);
    assert.strictEqual(invoice1.paidAmount, 0);
    assert.strictEqual(invoice1.remainingAmount, 627.0);
    console.log("   Invoice 1 created successfully:", invoice1.invoiceNo, "Total:", invoice1.total);

    // Verify cannot re-invoice already invoiced delivered quantities
    let duplicateInvoiceFailed = false;
    try {
      await invoiceService.createInvoice(testCompany.id, {
        deliveryId: delivery1.id,
      });
    } catch (err: unknown) {
      duplicateInvoiceFailed = true;
      assert.ok((err as Error).message.includes("Invoices only include quantities actually delivered") || (err as Error).message.includes("already been invoiced"));
    }
    assert.strictEqual(duplicateInvoiceFailed, true, "Cannot re-invoice already invoiced quantities");

    // 4. Payment on Invoice 1
    console.log("4. Testing invoice payment tracking...");
    // Partial payment: $200
    const partialPaidInvoice = await invoiceService.recordPayment(testCompany.id, invoice1.id, {
      amount: 200.0,
      notes: "First installment",
    });
    assert.strictEqual(partialPaidInvoice.paidAmount, 200.0);
    assert.strictEqual(partialPaidInvoice.remainingAmount, 427.0);
    assert.strictEqual(partialPaidInvoice.status, InvoiceStatus.PARTIALLY_PAID);

    // Remaining payment: $427
    const fullyPaidInvoice = await invoiceService.recordPayment(testCompany.id, invoice1.id, {
      amount: 427.0,
      notes: "Final installment",
    });
    assert.strictEqual(fullyPaidInvoice.paidAmount, 627.0);
    assert.strictEqual(fullyPaidInvoice.remainingAmount, 0);
    assert.strictEqual(fullyPaidInvoice.status, InvoiceStatus.PAID);
    assert.ok(fullyPaidInvoice.paidAt, "paidAt date must be recorded when fully paid");
    console.log("   Invoice 1 fully paid successfully");

    // Overpayment attempt should fail
    let overpaymentFailed = false;
    try {
      await invoiceService.recordPayment(testCompany.id, invoice1.id, {
        amount: 10.0,
      });
    } catch (err: unknown) {
      overpaymentFailed = true;
      assert.ok((err as Error).message.includes("already fully paid"));
    }
    assert.strictEqual(overpaymentFailed, true, "Overpayment on paid invoice must fail");

    // 5. Backorder fulfillment (partial fulfillment of the backorder)
    console.log("5. Testing backorder partial fulfillment and hierarchy tracking...");
    const firstBackorder = delivery1.createdBackorder!;

    // Fulfill 2 of the 4 remaining for Product A, and 0 of 5 for Product B
    const delivery2 = await backorderService.fulfillBackorder(
      testCompany.id,
      testSalesRep.id,
      firstBackorder.id,
      {
        trackingNumber: "TRK-002",
        notes: "Second partial shipment from backorder",
        items: [
          {
            salesOrderItemId: orderItemA.id,
            deliveredQuantity: 2,
          },
        ],
      },
    );

    assert.ok(delivery2.id);
    assert.strictEqual(delivery2.items![0].deliveredQuantity, 2);

    // Check that the original backorder status is now PARTIALLY_FULFILLED
    const updatedFirstBackorder = await backorderService.getBackorderById(firstBackorder.id, testCompany.id);
    assert.strictEqual(updatedFirstBackorder.status, BackorderStatus.PARTIALLY_FULFILLED);
    assert.strictEqual(updatedFirstBackorder.fulfilledQuantity, 2);
    assert.strictEqual(updatedFirstBackorder.remainingQuantity, 7); // 9 - 2 = 7

    // A child backorder should have been created for the remaining 7 units
    assert.ok(delivery2.createdBackorder, "Child backorder must be created for remaining units");
    assert.strictEqual(delivery2.createdBackorder!.parentBackorderId, firstBackorder.id);
    assert.strictEqual(delivery2.createdBackorder!.totalQuantity, 7);
    console.log("   Backorder partially fulfilled, child backorder created:", delivery2.createdBackorder!.backorderNo);

    // 6. Complete remaining fulfillment
    console.log("6. Testing complete fulfillment of remaining units...");
    const childBackorder = delivery2.createdBackorder!;

    // Deliver remaining 2 of Product A and 5 of Product B
    const delivery3 = await backorderService.fulfillBackorder(
      testCompany.id,
      testSalesRep.id,
      childBackorder.id,
      {
        trackingNumber: "TRK-003",
        notes: "Final shipment completing all backorders",
        items: [
          {
            salesOrderItemId: orderItemA.id,
            deliveredQuantity: 2,
          },
          {
            salesOrderItemId: orderItemB.id,
            deliveredQuantity: 5,
          },
        ],
      },
    );

    assert.ok(delivery3.id);
    assert.strictEqual(delivery3.createdBackorder, null, "No further backorder when all remaining units are delivered");

    // The child backorder should now be FULFILLED
    const completedChildBackorder = await backorderService.getBackorderById(childBackorder.id, testCompany.id);
    assert.strictEqual(completedChildBackorder.status, BackorderStatus.FULFILLED);
    assert.strictEqual(completedChildBackorder.remainingQuantity, 0);

    // Sales Order should now be DELIVERED
    const finalOrder = await salesOrderService.getOrderById(salesOrder.id, testCompany.id);
    assert.strictEqual(finalOrder.status, SalesOrderStatus.DELIVERED);
    const finalItemA = finalOrder.items!.find((i) => i.productId === testProductA.id)!;
    const finalItemB = finalOrder.items!.find((i) => i.productId === testProductB.id)!;
    assert.strictEqual(finalItemA.deliveredQuantity, 10);
    assert.strictEqual(finalItemB.deliveredQuantity, 5);
    console.log("   Order status after full delivery:", finalOrder.status);

    // 7. Invoice for remaining delivered quantities
    console.log("7. Testing invoice generation for remaining delivered items...");
    const invoice2 = await invoiceService.createInvoice(testCompany.id, {
      salesOrderId: salesOrder.id,
      paymentTerms: "Net 15",
    });

    assert.ok(invoice2.id);
    assert.strictEqual(invoice2.items?.length, 2);
    // Product A: 4 delivered uninvoiced units. Subtotal = 400. Discount = 20. Taxable = 380. Tax = 38. LineTotal = 418.
    // Product B: 5 delivered uninvoiced units. Subtotal = 250. Discount = 0. Taxable = 250. Tax = 25. LineTotal = 275.
    // Total Subtotal = 650. Total Discount = 20. Total Tax = 63. Total = 693.
    assert.strictEqual(invoice2.subtotal, 650.0);
    assert.strictEqual(invoice2.discount, 20.0);
    assert.strictEqual(invoice2.tax, 63.0);
    assert.strictEqual(invoice2.total, 693.0);
    console.log("   Invoice 2 created successfully:", invoice2.invoiceNo, "Total:", invoice2.total);

    // 8. Test creating sales order from an accepted quotation
    console.log("8. Testing sales order creation from accepted quotation...");
    const testDeal = await prisma.deal.create({
      data: {
        companyId: testCompany.id,
        customerId: testUser.id,
        salesRepId: testSalesRep.id,
        dealNo: `DL-TEST-${Date.now()}`,
        name: "Commercial Contract 2026",
      },
    });

    const quotation = await prisma.quotation.create({
      data: {
        companyId: testCompany.id,
        quotationNo: `QT-TEST-${Date.now()}`,
        dealId: testDeal.id,
        customerId: testUser.id,
        salesRepId: testSalesRep.id,
        status: "ACCEPTED",
        currency: "USD",
        items: {
          create: [
            {
              productId: testProductA.id,
              quantity: 20,
              unitPrice: 100.0,
              discountAmount: 100.0,
              taxRate: 5.0,
              finalUnitPrice: 95.0,
              lineTotal: 1995.0,
            },
          ],
        },
      },
    });

    const quotationOrder = await salesOrderService.createSalesOrder(
      testCompany.id,
      testSalesRep.id,
      {
        quotationId: quotation.id,
      },
    );

    assert.ok(quotationOrder.id);
    assert.strictEqual(quotationOrder.quotationId, quotation.id);
    assert.strictEqual(quotationOrder.items?.length, 1);
    assert.strictEqual(quotationOrder.items![0].orderedQuantity, 20);
    assert.strictEqual(quotationOrder.items![0].unitPrice, 100.0);
    console.log("   Quotation converted to sales order successfully:", quotationOrder.orderNo);

    console.log("All invoice and backorder integration tests passed successfully!");
  } finally {
    // Cleanup
    await prisma.invoiceItem.deleteMany({ where: { invoice: { companyId: testCompany.id } } });
    await prisma.invoice.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.deliveryItem.deleteMany({ where: { delivery: { companyId: testCompany.id } } });
    await prisma.delivery.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.backorderItem.deleteMany({ where: { backorder: { companyId: testCompany.id } } });
    await prisma.backorder.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.salesOrderItem.deleteMany({ where: { salesOrder: { companyId: testCompany.id } } });
    await prisma.salesOrder.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.quotationItem.deleteMany({ where: { quotation: { companyId: testCompany.id } } });
    await prisma.quotation.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.deal.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.product.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.companyUser.deleteMany({ where: { companyId: testCompany.id } });
    await prisma.company.delete({ where: { id: testCompany.id } });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, testSalesRep.id] } } });
    console.log("Cleaned up test data.");
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });

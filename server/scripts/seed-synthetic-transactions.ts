import {
  PrismaClient,
  CompanyUserRole,
  DealStage,
  DealStatus,
  QuotationStatus,
  RevisionType,
  RevisionStatus,
  DiscountType,
  SubscriptionType,
  SubscriptionStatus,
  CustomerTier,
  ProductType,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";

// ============================================================================
// DEALFLOW360 SYNTHETIC TRANSACTIONS SEEDER
// Seeds deals, quotations (with revisions & negotiations), and subscriptions
// ============================================================================

export async function seedSyntheticTransactions() {
  console.log("Seeding synthetic Deals, Quotations, and Subscriptions...");

  // 1. Fetch Primary Company
  const primaryCompany = await prisma.company.findFirst({
    where: { name: "DealFlow Apex Technologies" },
  });

  if (!primaryCompany) {
    throw new Error(
      "Primary company 'DealFlow Apex Technologies' not found. Please run db:seed first.",
    );
  }

  // 2. Fetch Sales Reps and Customers for the Primary Company
  const salesRepMembers = await prisma.companyUser.findMany({
    where: {
      companyId: primaryCompany.id,
      role: { in: [CompanyUserRole.SALES_REP, CompanyUserRole.SALES_MANAGER] },
    },
    include: { user: true },
  });

  const customerMembers = await prisma.companyUser.findMany({
    where: {
      companyId: primaryCompany.id,
      role: CompanyUserRole.CUSTOMER,
    },
    include: { user: true },
  });

  if (salesRepMembers.length === 0 || customerMembers.length === 0) {
    throw new Error(
      "Missing sales reps or customers in primary company. Please ensure primary company is properly seeded.",
    );
  }

  const products = await prisma.product.findMany({
    where: { companyId: primaryCompany.id },
  });

  if (products.length === 0) {
    throw new Error(
      "No products found for primary company. Please run db:seed first.",
    );
  }

  const oneTimeProducts = products.filter((p) => p.type === ProductType.ONE_TIME);
  const recurringProducts = products.filter(
    (p) => p.type === ProductType.RECURRING,
  );

  console.log(
    `Found ${salesRepMembers.length} sales staff, ${customerMembers.length} customers, and ${products.length} products.`,
  );

  // --------------------------------------------------------------------------
  // 3. SEED SUBSCRIPTION PRICING RULES
  // --------------------------------------------------------------------------
  console.log("Seeding subscription pricing matrices...");
  const createdPricings = [];
  const recurringToPrice = recurringProducts.slice(0, 15);

  for (const prod of recurringToPrice) {
    const basePrice = Number(prod.price);
    const tiers: CustomerTier[] = [
      CustomerTier.BRONZE,
      CustomerTier.SILVER,
      CustomerTier.GOLD,
    ];
    const subTypes: SubscriptionType[] = [
      SubscriptionType.MONTHLY,
      SubscriptionType.QUARTERLY,
      SubscriptionType.YEARLY,
    ];

    for (const subType of subTypes) {
      for (const tier of tiers) {
        let multiplier = 1;
        if (subType === SubscriptionType.QUARTERLY) multiplier = 2.85; // 5% discount
        if (subType === SubscriptionType.YEARLY) multiplier = 10.5; // ~12% discount

        let tierDiscountMultiplier = 1;
        if (tier === CustomerTier.SILVER) tierDiscountMultiplier = 0.95;
        if (tier === CustomerTier.GOLD) tierDiscountMultiplier = 0.88;

        const calculatedPrice = Number(
          (basePrice * multiplier * tierDiscountMultiplier).toFixed(2),
        );

        const pricing = await prisma.subscriptionPricing.create({
          data: {
            companyId: primaryCompany.id,
            productId: prod.id,
            subscriptionType: subType,
            customerTier: tier,
            price: calculatedPrice,
            minQuantity: 1,
            currency: "USD",
            isActive: true,
          },
        });
        createdPricings.push(pricing);
      }
    }
  }
  console.log(`Created ${createdPricings.length} subscription pricing records.`);

  // --------------------------------------------------------------------------
  // 4. SEED DEALS
  // --------------------------------------------------------------------------
  console.log("Seeding synthetic deals...");

  const dealTemplates = [
    {
      name: "Global Cloud Infrastructure Modernization Q3",
      stage: DealStage.WON,
      status: DealStatus.WON,
      expectedValue: 125000.0,
      probability: 100.0,
      source: "Direct Inbound",
    },
    {
      name: "Next-Gen Enterprise SIEM & SOC Deployment",
      stage: DealStage.QUOTATION,
      status: DealStatus.OPEN,
      expectedValue: 84000.0,
      probability: 70.0,
      source: "Partner Referral",
    },
    {
      name: "Autonomous AI Inference Workstation Cluster",
      stage: DealStage.NEGOTIATION,
      status: DealStatus.OPEN,
      expectedValue: 160000.0,
      probability: 85.0,
      source: "Webinar Lead",
    },
    {
      name: "Multi-Region Distributed Database Migration",
      stage: DealStage.WON,
      status: DealStatus.WON,
      expectedValue: 56000.0,
      probability: 100.0,
      source: "Existing Customer Upsell",
    },
    {
      name: "Corporate Datacenter Power & Rack Refresh",
      stage: DealStage.REQUIREMENT,
      status: DealStatus.OPEN,
      expectedValue: 92000.0,
      probability: 50.0,
      source: "Outbound Campaign",
    },
    {
      name: "Zero Trust Network Access & Identity Architecture",
      stage: DealStage.QUALIFICATION,
      status: DealStatus.OPEN,
      expectedValue: 45000.0,
      probability: 30.0,
      source: "Trade Show",
    },
    {
      name: "Enterprise VoIP & Contact Center Upgrade 500 Seats",
      stage: DealStage.QUOTATION,
      status: DealStatus.OPEN,
      expectedValue: 68000.0,
      probability: 65.0,
      source: "Direct Inbound",
    },
    {
      name: "High Performance SAN NVMe Storage Expansion 200TB",
      stage: DealStage.WON,
      status: DealStatus.WON,
      expectedValue: 148000.0,
      probability: 100.0,
      source: "Existing Customer Upsell",
    },
    {
      name: "Mission Critical 24/7 Platinum Support SLA Contract",
      stage: DealStage.NEGOTIATION,
      status: DealStatus.OPEN,
      expectedValue: 38400.0,
      probability: 80.0,
      source: "Renewal Opportunity",
    },
    {
      name: "Industrial IoT Edge Gateway Fleet Deployment",
      stage: DealStage.NEW,
      status: DealStatus.OPEN,
      expectedValue: 32000.0,
      probability: 20.0,
      source: "Website Lead Form",
    },
    {
      name: "Managed Kubernetes Control Plane & Observability Suite",
      stage: DealStage.QUOTATION,
      status: DealStatus.OPEN,
      expectedValue: 52000.0,
      probability: 75.0,
      source: "Partner Referral",
    },
    {
      name: "Legacy Hardware Decommissioning & SLA Maintenance",
      stage: DealStage.LOST,
      status: DealStatus.LOST,
      expectedValue: 28000.0,
      probability: 0.0,
      source: "Cold Outreach",
    },
    {
      name: "Enterprise DevSecOps Pipeline Hardening & SAST Rollout",
      stage: DealStage.WON,
      status: DealStatus.WON,
      expectedValue: 41000.0,
      probability: 100.0,
      source: "Direct Inbound",
    },
    {
      name: "Conference Room Smart Collaboration Displays Rollout",
      stage: DealStage.REQUIREMENT,
      status: DealStatus.OPEN,
      expectedValue: 35000.0,
      probability: 40.0,
      source: "Outbound Campaign",
    },
    {
      name: "Full-Stack APM & Distributed Tracing Platform",
      stage: DealStage.QUOTATION,
      status: DealStatus.OPEN,
      expectedValue: 29500.0,
      probability: 60.0,
      source: "Webinar Lead",
    },
    {
      name: "Fractional CISO & Compliance Audit Advisory 1-Year",
      stage: DealStage.WON,
      status: DealStatus.WON,
      expectedValue: 54000.0,
      probability: 100.0,
      source: "Executive Network",
    },
    {
      name: "Top-of-Rack 100GbE Leaf-Spine Switch Replacement",
      stage: DealStage.QUALIFICATION,
      status: DealStatus.OPEN,
      expectedValue: 78000.0,
      probability: 35.0,
      source: "Direct Inbound",
    },
    {
      name: "Disaster Recovery Standby Site Infrastructure",
      stage: DealStage.NEGOTIATION,
      status: DealStatus.OPEN,
      expectedValue: 110000.0,
      probability: 80.0,
      source: "Partner Referral",
    },
    {
      name: "Enterprise E-Signature & Document Workflow Automation",
      stage: DealStage.LOST,
      status: DealStatus.LOST,
      expectedValue: 18500.0,
      probability: 0.0,
      source: "Outbound Campaign",
    },
    {
      name: "AI LLM Fine-Tuning & Inference Gateway Setup",
      stage: DealStage.QUOTATION,
      status: DealStatus.OPEN,
      expectedValue: 96000.0,
      probability: 70.0,
      source: "Direct Inbound",
    },
    {
      name: "High-Density 4U Quad-Socket Server Farm Expansion",
      stage: DealStage.WON,
      status: DealStatus.WON,
      expectedValue: 185000.0,
      probability: 100.0,
      source: "Existing Customer Upsell",
    },
    {
      name: "Immutable Ransomware-Proof Backup Appliance Deployment",
      stage: DealStage.NEW,
      status: DealStatus.OPEN,
      expectedValue: 42000.0,
      probability: 25.0,
      source: "Website Lead Form",
    },
    {
      name: "Automated Penetration Testing & Vulnerability Retainer",
      stage: DealStage.REQUIREMENT,
      status: DealStatus.OPEN,
      expectedValue: 26000.0,
      probability: 45.0,
      source: "Partner Referral",
    },
    {
      name: "Global Object Storage & Archival Tier Migration",
      stage: DealStage.QUOTATION,
      status: DealStatus.OPEN,
      expectedValue: 33000.0,
      probability: 60.0,
      source: "Direct Inbound",
    },
  ];

  const createdDeals = [];

  for (let i = 0; i < dealTemplates.length; i++) {
    const template = dealTemplates[i];
    const customer = customerMembers[i % customerMembers.length].user;
    const salesRep = salesRepMembers[i % salesRepMembers.length].user;
    const dealNo = `DEAL-2026-${String(i + 1).padStart(4, "0")}`;

    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + (i * 3 + 10));

    const deal = await prisma.deal.create({
      data: {
        companyId: primaryCompany.id,
        dealNo,
        customerId: customer.id,
        salesRepId: salesRep.id,
        name: template.name,
        stage: template.stage,
        status: template.status,
        expectedValue: template.expectedValue,
        probability: template.probability,
        expectedCloseDate: closeDate,
        source: template.source,
      },
    });
    createdDeals.push({ deal, customer, salesRep });
  }
  console.log(`Created ${createdDeals.length} synthetic deals.`);

  // --------------------------------------------------------------------------
  // 5. SEED QUOTATIONS, REVISIONS, ITEMS, AND NEGOTIATIONS
  // --------------------------------------------------------------------------
  console.log("Seeding synthetic quotations, revisions, and negotiations...");

  const quotationConfigs = [
    { status: QuotationStatus.ACCEPTED, dealIndex: 0, itemsCount: 4, hasNegotiation: false },
    { status: QuotationStatus.SENT, dealIndex: 1, itemsCount: 3, hasNegotiation: false },
    { status: QuotationStatus.NEGOTIATING, dealIndex: 2, itemsCount: 3, hasNegotiation: true },
    { status: QuotationStatus.ACCEPTED, dealIndex: 3, itemsCount: 2, hasNegotiation: true },
    { status: QuotationStatus.DRAFT, dealIndex: 4, itemsCount: 2, hasNegotiation: false },
    { status: QuotationStatus.DRAFT, dealIndex: 5, itemsCount: 3, hasNegotiation: false },
    { status: QuotationStatus.SENT, dealIndex: 6, itemsCount: 4, hasNegotiation: false },
    { status: QuotationStatus.ACCEPTED, dealIndex: 7, itemsCount: 3, hasNegotiation: false },
    { status: QuotationStatus.NEGOTIATING, dealIndex: 8, itemsCount: 2, hasNegotiation: true },
    { status: QuotationStatus.DRAFT, dealIndex: 9, itemsCount: 2, hasNegotiation: false },
    { status: QuotationStatus.SENT, dealIndex: 10, itemsCount: 3, hasNegotiation: false },
    { status: QuotationStatus.REJECTED, dealIndex: 11, itemsCount: 2, hasNegotiation: true },
    { status: QuotationStatus.ACCEPTED, dealIndex: 12, itemsCount: 3, hasNegotiation: false },
    { status: QuotationStatus.DRAFT, dealIndex: 13, itemsCount: 2, hasNegotiation: false },
    { status: QuotationStatus.SENT, dealIndex: 14, itemsCount: 3, hasNegotiation: false },
    { status: QuotationStatus.ACCEPTED, dealIndex: 15, itemsCount: 2, hasNegotiation: false },
    { status: QuotationStatus.EXPIRED, dealIndex: 16, itemsCount: 3, hasNegotiation: false },
    { status: QuotationStatus.NEGOTIATING, dealIndex: 17, itemsCount: 4, hasNegotiation: true },
    { status: QuotationStatus.CANCELLED, dealIndex: 18, itemsCount: 2, hasNegotiation: false },
    { status: QuotationStatus.SENT, dealIndex: 19, itemsCount: 3, hasNegotiation: false },
  ];

  const createdQuotations = [];

  for (let qIdx = 0; qIdx < quotationConfigs.length; qIdx++) {
    const config = quotationConfigs[qIdx];
    const { deal, customer, salesRep } = createdDeals[config.dealIndex];
    const quotationNo = `QUO-2026-${String(qIdx + 1).padStart(4, "0")}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // 5.1 Create Base Quotation
    const quotation = await prisma.quotation.create({
      data: {
        companyId: primaryCompany.id,
        quotationNo,
        dealId: deal.id,
        customerId: customer.id,
        salesRepId: salesRep.id,
        status: config.status,
        currency: "USD",
        validUntil,
      },
    });

    // Pick unique products for this quotation
    const selectedProducts: typeof products = [];
    const productOffset = (qIdx * 7) % products.length;
    for (let p = 0; p < config.itemsCount; p++) {
      const prod = products[(productOffset + p) % products.length];
      selectedProducts.push(prod);
    }

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const itemsData = [];
    for (let itemIdx = 0; itemIdx < selectedProducts.length; itemIdx++) {
      const prod = selectedProducts[itemIdx];
      const quantity = (itemIdx + 1) * 2;
      const unitPrice = Number(prod.price);
      const discountPercent = 5.0;
      const discountAmount = Number(((unitPrice * quantity * discountPercent) / 100).toFixed(2));
      const taxRate = 8.5;
      const lineBeforeTax = unitPrice * quantity - discountAmount;
      const finalUnitPrice = Number((lineBeforeTax / quantity).toFixed(2));
      const lineTotal = Number(lineBeforeTax.toFixed(2));

      subtotal += unitPrice * quantity;
      totalDiscount += discountAmount;
      totalTax += (lineTotal * taxRate) / 100;

      itemsData.push({
        productId: prod.id,
        quantity,
        unitPrice,
        discountType: DiscountType.PERCENTAGE,
        discountValue: discountPercent,
        discountAmount,
        taxRate,
        finalUnitPrice,
        lineTotal,
      });
    }

    const grandTotal = Number((subtotal - totalDiscount + totalTax).toFixed(2));

    // 5.2 Create QuotationItems
    const createdItems = [];
    for (const item of itemsData) {
      const createdItem = await prisma.quotationItem.create({
        data: {
          quotationId: quotation.id,
          ...item,
        },
      });
      createdItems.push(createdItem);
    }

    // 5.3 Create Initial Quotation Revision (Revision 1)
    const revision1 = await prisma.quotationRevision.create({
      data: {
        quotationId: quotation.id,
        revisionNo: 1,
        createdById: salesRep.id,
        revisionType: RevisionType.INITIAL,
        status:
          config.status === QuotationStatus.ACCEPTED
            ? RevisionStatus.ACCEPTED
            : config.status === QuotationStatus.REJECTED
              ? RevisionStatus.REJECTED
              : RevisionStatus.SENT,
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(totalDiscount.toFixed(2)),
        taxAmount: Number(totalTax.toFixed(2)),
        totalAmount: grandTotal,
        customerNote: "Thank you for considering DealFlow Apex Technologies.",
        internalNote: "Initial commercial quotation prepared according to standard discount policy.",
      },
    });

    for (const item of itemsData) {
      await prisma.quotationRevisionItem.create({
        data: {
          quotationRevisionId: revision1.id,
          ...item,
        },
      });
    }

    let activeRevisionId = revision1.id;

    // 5.4 If negotiating, add Counter Revision & Negotiation record
    if (config.hasNegotiation) {
      const isApproved = config.status === QuotationStatus.ACCEPTED;
      const isRejected = config.status === QuotationStatus.REJECTED;

      const revision2 = await prisma.quotationRevision.create({
        data: {
          quotationId: quotation.id,
          revisionNo: 2,
          createdById: customer.id,
          revisionType: RevisionType.CUSTOMER_COUNTER,
          status: isApproved
            ? RevisionStatus.ACCEPTED
            : isRejected
              ? RevisionStatus.REJECTED
              : RevisionStatus.SENT,
          subtotal: Number(subtotal.toFixed(2)),
          discountAmount: Number((totalDiscount * 1.5).toFixed(2)),
          taxAmount: Number(totalTax.toFixed(2)),
          totalAmount: Number((grandTotal - totalDiscount * 0.5).toFixed(2)),
          customerNote:
            "Requesting a 10% volume discount tier given our multi-year rollout roadmap.",
          internalNote:
            "Customer requested additional 5% discount concession. Routing for manager review.",
        },
      });

      for (const item of itemsData) {
        await prisma.quotationRevisionItem.create({
          data: {
            quotationRevisionId: revision2.id,
            ...item,
            discountValue: 10.0,
            discountAmount: Number(((item.unitPrice * item.quantity * 10.0) / 100).toFixed(2)),
            lineTotal: Number((item.unitPrice * item.quantity * 0.9).toFixed(2)),
          },
        });
      }

      activeRevisionId = revision2.id;

      // Create Negotiation entry
      const negotiation = await prisma.negotiation.create({
        data: {
          quotationId: quotation.id,
          status: isApproved
            ? "APPROVED"
            : isRejected
              ? "REJECTED"
              : "PENDING",
          message:
            "Customer submitted formal counter-offer requesting special tier discount for enterprise cluster.",
          riskScore: 35.0,
          riskLevel: "LOW",
          requiredRole: "SALES_MANAGER",
          approvedBy: isApproved ? salesRep.id : null,
          approvedAt: isApproved ? new Date() : null,
          rejectedBy: isRejected ? salesRep.id : null,
          rejectedAt: isRejected ? new Date() : null,
          rejectionReason: isRejected ? "Discount request exceeds maximum margin threshold." : null,
        },
      });

      // Add negotiation items
      for (let i = 0; i < createdItems.length; i++) {
        const item = createdItems[i];
        await prisma.negotiationItem.create({
          data: {
            negotiationId: negotiation.id,
            quotationItemId: item.id,
            productId: item.productId,
            requestedQuantity: item.quantity,
            requestedUnitPrice: item.unitPrice,
            requestedDiscountType: DiscountType.PERCENTAGE,
            requestedDiscountValue: 10.0,
            requestedLineTotal: Number((Number(item.unitPrice) * Number(item.quantity) * 0.9).toFixed(2)),
          },
        });
      }
    }

    // Set currentRevisionId
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { currentRevisionId: activeRevisionId },
    });

    createdQuotations.push({ quotation, grandTotal, items: createdItems });
  }
  console.log(`Created ${createdQuotations.length} synthetic quotations with revisions and items.`);

  // --------------------------------------------------------------------------
  // 6. SEED SUBSCRIPTIONS
  // --------------------------------------------------------------------------
  console.log("Seeding synthetic subscriptions...");

  const subscriptionConfigs = [
    { subType: SubscriptionType.MONTHLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -90 },
    { subType: SubscriptionType.YEARLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -180 },
    { subType: SubscriptionType.QUARTERLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -60 },
    { subType: SubscriptionType.MONTHLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -30 },
    { subType: SubscriptionType.YEARLY, status: SubscriptionStatus.ACTIVE, durationMonths: 24, startOffset: -365 },
    { subType: SubscriptionType.QUARTERLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -45 },
    { subType: SubscriptionType.MONTHLY, status: SubscriptionStatus.EXPIRED, durationMonths: 6, startOffset: -240 },
    { subType: SubscriptionType.YEARLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -120 },
    { subType: SubscriptionType.MONTHLY, status: SubscriptionStatus.CANCELLED, durationMonths: 12, startOffset: -150, cancelReason: "Client consolidated tooling into single provider" },
    { subType: SubscriptionType.QUARTERLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -90 },
    { subType: SubscriptionType.YEARLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -200 },
    { subType: SubscriptionType.MONTHLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -15 },
    { subType: SubscriptionType.YEARLY, status: SubscriptionStatus.ACTIVE, durationMonths: 36, startOffset: -400 },
    { subType: SubscriptionType.QUARTERLY, status: SubscriptionStatus.EXPIRED, durationMonths: 6, startOffset: -300 },
    { subType: SubscriptionType.MONTHLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -75 },
    { subType: SubscriptionType.YEARLY, status: SubscriptionStatus.ACTIVE, durationMonths: 12, startOffset: -10 },
  ];

  const createdSubscriptions = [];

  for (let sIdx = 0; sIdx < subscriptionConfigs.length; sIdx++) {
    const sConf = subscriptionConfigs[sIdx];
    const customer = customerMembers[sIdx % customerMembers.length].user;
    const acceptedQuotation = createdQuotations.find(
      (q) => q.quotation.status === QuotationStatus.ACCEPTED && q.quotation.customerId === customer.id,
    )?.quotation;

    const subNo = `SUB-2026-${String(sIdx + 1).padStart(4, "0")}`;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + sConf.startOffset);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + sConf.durationMonths);

    const nextRenewalDate = new Date(startDate);
    if (sConf.subType === SubscriptionType.MONTHLY) {
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
    } else if (sConf.subType === SubscriptionType.QUARTERLY) {
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 3);
    } else {
      nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
    }

    // Select 2-3 recurring products
    const subProducts = recurringProducts.slice((sIdx * 2) % recurringProducts.length, ((sIdx * 2) % recurringProducts.length) + 2);
    if (subProducts.length === 0) {
      subProducts.push(recurringProducts[0]);
    }

    let recurringTotal = 0;
    const subItemsData = [];
    for (const sp of subProducts) {
      const qty = 5;
      const unitPrice = Number(sp.price);
      const lineTotal = unitPrice * qty;
      recurringTotal += lineTotal;
      subItemsData.push({
        productId: sp.id,
        quantity: qty,
        unitPrice,
        discount: 0,
        lineTotal,
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        companyId: primaryCompany.id,
        subscriptionNo: subNo,
        customerId: customer.id,
        quotationId: acceptedQuotation ? acceptedQuotation.id : null,
        subscriptionType: sConf.subType,
        status: sConf.status,
        startDate,
        endDate,
        nextRenewalDate,
        currency: "USD",
        totalRecurringAmount: Number(recurringTotal.toFixed(2)),
        cancelledAt: sConf.status === SubscriptionStatus.CANCELLED ? new Date() : null,
        cancellationReason: sConf.cancelReason || null,
        notes: `Enterprise recurring subscription under ${primaryCompany.name}.`,
      },
    });

    // Create Subscription Items
    for (const item of subItemsData) {
      await prisma.subscriptionItem.create({
        data: {
          subscriptionId: subscription.id,
          ...item,
        },
      });
    }

    // Create Subscription Periods (Billing History)
    const periodCount = sConf.subType === SubscriptionType.MONTHLY ? 3 : sConf.subType === SubscriptionType.QUARTERLY ? 2 : 1;
    for (let pNum = 1; pNum <= periodCount; pNum++) {
      const pStart = new Date(startDate);
      const pEnd = new Date(startDate);

      if (sConf.subType === SubscriptionType.MONTHLY) {
        pStart.setMonth(pStart.getMonth() + (pNum - 1));
        pEnd.setMonth(pEnd.getMonth() + pNum);
      } else if (sConf.subType === SubscriptionType.QUARTERLY) {
        pStart.setMonth(pStart.getMonth() + (pNum - 1) * 3);
        pEnd.setMonth(pEnd.getMonth() + pNum * 3);
      } else {
        pEnd.setFullYear(pEnd.getFullYear() + 1);
      }

      await prisma.subscriptionPeriod.create({
        data: {
          subscriptionId: subscription.id,
          periodNumber: pNum,
          startDate: pStart,
          endDate: pEnd,
          subscriptionType: sConf.subType,
          totalAmount: Number(recurringTotal.toFixed(2)),
          renewedById: salesRepMembers[0].user.id,
          renewedAt: pStart,
          itemsSnapshot: subItemsData,
          notes: `Billing cycle #${pNum} successfully settled.`,
        },
      });
    }

    createdSubscriptions.push(subscription);
  }
  console.log(`Created ${createdSubscriptions.length} synthetic subscriptions with items and periods.`);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("====================================================================");
  console.log("       SYNTHETIC TRANSACTIONS SEEDING COMPLETED SUCCESSFULLY        ");
  console.log("====================================================================");
  console.log(`Subscription Pricing Rules: ${createdPricings.length}`);
  console.log(`Deals Created:              ${createdDeals.length}`);
  console.log(`Quotations Created:         ${createdQuotations.length}`);
  console.log(`Subscriptions Created:      ${createdSubscriptions.length}`);
  console.log("====================================================================");
}

async function run() {
  try {
    await seedSyntheticTransactions();
  } catch (error) {
    console.error("Synthetic transactions seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

if (process.argv[1]?.endsWith("seed-synthetic-transactions.ts")) {
  run();
}

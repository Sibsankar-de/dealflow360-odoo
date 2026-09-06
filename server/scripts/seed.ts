import bcrypt from "bcrypt";
import {
  CompanyUserRole,
  CustomerTier,
  CompanyStatus,
  ProductType,
  UserRole,
  AuthProvider,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";

// ============================================================================
// DEALFLOW360 COMPREHENSIVE SEED SCRIPT
//
// CREDENTIALS INFORMATION:
// Default plain text password for all seeded users: Password123!
// Primary Admin User:
//   Email:    admin@dealflow.com
//   Password: Password123!
//
// Primary Company:
//   Name:     DealFlow Apex Technologies
//   Admin:    admin@dealflow.com
//   Staff:    2 Sales Managers, 5 Sales Reps, 2 Finance Managers
//   Clients:  30 Dedicated Customers (10 Gold, 10 Silver, 10 Bronze)
//   Storage:  10 Regional Warehouses
//   Catalog:  20 Product Categories, 200 Products with Stock & Discount Tiers
// ============================================================================

export const SEEDED_PASSWORD = "Password123!";

interface ProductDefinition {
  name: string;
  description: string;
  price: number;
  baseUnit: string;
  type: ProductType;
  discountTiers?: Array<{ customerTier: CustomerTier; discountPercent: number }>;
}

const CATEGORY_DEFINITIONS: Array<{
  name: string;
  description: string;
  products: ProductDefinition[];
}> = [
  {
    name: "Cloud Infrastructure & Compute",
    description: "Enterprise grade cloud virtual machines, clusters and dedicated compute instances",
    products: [
      { name: "Apex Cloud VM Standard 4-Core", description: "4 vCPU, 16GB RAM, 100GB NVMe SSD high-availability compute instance", price: 120.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Apex Cloud VM Compute Pro 16-Core", description: "16 vCPU, 64GB RAM, 500GB NVMe SSD optimized for compute intensive jobs", price: 450.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Apex Bare-Metal Dedicated Server D128", description: "Dedicated 128-core AMD EPYC server with 512GB ECC DDR5 and redundant 10Gbps uplink", price: 1850.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Apex GPU Compute Node A100", description: "High performance AI/ML compute node equipped with NVIDIA A100 80GB Tensor Core GPU", price: 2900.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Apex Serverless Compute Cluster Tier 1", description: "Event-driven auto-scaling compute capacity for container workloads up to 10M executions", price: 280.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Cloud Migration Appliance Box X1", description: "Ruggedized 100TB physical data transfer appliance for rapid petabyte-scale cloud migrations", price: 1450.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Hybrid Cloud Bridge Gateway", description: "Hardware router device facilitating encrypted 10Gbps tunnel between on-premise datacenter and cloud", price: 2200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Private Cloud Appliance Pod 24U", description: "Pre-configured hyperconverged private cloud rack pod with compute, storage and SDN", price: 34000.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Edge Compute MicroServer V2", description: "Compact rugged edge server for low-latency IoT and branch-office processing", price: 1890.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Cloud Compute Disaster Recovery License", description: "Continuous replication and warm-standby compute node license per cluster", price: 850.0, baseUnit: "MONTH", type: ProductType.RECURRING },
    ],
  },
  {
    name: "Cybersecurity & Identity",
    description: "Zero trust security, identity governance, endpoint defense, and threat detection",
    products: [
      { name: "CyberShield Endpoint Detection & Response (EDR)", description: "Real-time AI powered endpoint protection and automated threat remediation per endpoint", price: 14.5, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "ZeroTrust Identity & Access Manager Enterprise", description: "SAML 2.0 / OIDC SSO, Adaptive MFA and biometric authentication suite", price: 9.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Apex NextGen Firewall Hardware Appliance 5000", description: "100 Gbps deep packet inspection enterprise hardware firewall with TLS 1.3 decryption", price: 14800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Web Application Firewall (WAF) Cloud Shield", description: "Global distributed edge WAF protecting against OWASP Top 10 and Layer 7 DDoS attacks", price: 650.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Privileged Access Management (PAM) Suite", description: "Vaulting, session recording, and automated credential rotation for administrative accounts", price: 4200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Hardware Security Module (HSM) FIPS 140-3", description: "Tamper-evident PCIe crypto-accelerator card for high assurance key storage", price: 9500.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Security Information & Event Management (SIEM) Ingestion", description: "Cloud SIEM log ingestion and correlation engine license up to 500GB/day", price: 1800.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Automated Penetration Testing & Vulnerability Scanner", description: "Continuous external attack surface management and automated vulnerability discovery", price: 950.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Secure Email Gateway Protection", description: "Anti-phishing, link sandboxing, and business email compromise prevention license", price: 6.5, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Data Loss Prevention (DLP) Enterprise Agent", description: "Sensitive content discovery and exfiltration prevention across endpoints and cloud storage", price: 12.0, baseUnit: "SEAT", type: ProductType.RECURRING },
    ],
  },
  {
    name: "Databases & Big Data",
    description: "Managed relational, NoSQL, data warehousing and real-time streaming engines",
    products: [
      { name: "Apex Managed PostgreSQL High-Availability Cluster", description: "Primary with two synchronous read-replicas, automated failover, and point-in-time backups", price: 850.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Distributed NoSQL Key-Value Cluster", description: "Globally distributed low-latency multi-region NoSQL cluster with multi-master replication", price: 1200.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Cloud Data Warehouse Compute Slot", description: "Columnar petabyte-scale analytical data warehouse compute processing unit", price: 2100.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Real-Time Apache Kafka Event Streaming Engine", description: "Fully managed Kafka broker cluster with 3 brokers and Schema Registry", price: 780.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Vector Database Engine for AI Search", description: "High dimensional vector database supporting billion-scale embeddings and HNSW indexing", price: 1400.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Database Acceleration PCIe Storage Card 3.2TB", description: "Ultra-low latency NVMe enterprise write-intensive card for database write logging", price: 2600.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "In-Memory Redis Cache Cluster 64GB", description: "High throughput sub-millisecond Redis in-memory cache cluster with auto failover", price: 420.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Data Catalog & Governance Platform License", description: "Automated schema crawler, lineage tracker, and metadata repository", price: 3800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "ETL / Data Pipeline Orchestrator Pro", description: "Scalable data integration pipeline engine with 200+ prebuilt enterprise connectors", price: 620.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Graph Database Enterprise Multi-Node License", description: "High-performance property graph database for fraud detection and knowledge graphs", price: 8900.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
  {
    name: "AI & Machine Learning Platforms",
    description: "Deep learning models, inference accelerators, fine-tuning infrastructure, and MLOps",
    products: [
      { name: "Apex Large Language Model Enterprise API Tier 1", description: "Dedicated LLM inference endpoint with 10M token monthly quota and 99.99% SLA", price: 1500.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "MLOps Model Training & Deployment Platform", description: "Collaborative notebook environment, experiment tracker, and containerized serving engine", price: 950.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "AI Inference Accelerator Box Dual H100", description: "Enterprise server housing dual NVIDIA H100 SXM5 GPUs with NVLink interconnect", price: 48000.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Document Intelligence OCR & Extraction Engine", description: "Neural layout analysis and structured entity extraction for invoices, contracts and IDs", price: 450.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Computer Vision Edge Inference Camera Module", description: "Industrial 4K smart camera with integrated TensorRT onboard vision processing", price: 1250.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Speech-to-Text Real-time Transcription Stream", description: "Multilingual acoustic neural model streaming API for enterprise contact centers", price: 380.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "AI Synthetic Data Generator Studio", description: "Privacy-preserving tabular and image synthetic data generation workbench", price: 2800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Fine-Tuning Cluster Allocation 100 GPU-Hours", description: "Preemptible high performance GPU cluster training hours package", price: 800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Enterprise Semantic Search Engine License", description: "Hybrid sparse-dense retrieval engine with neural cross-encoder reranking", price: 5400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "AI Guardrails & Safety Monitoring SDK", description: "Hallucination detection, prompt injection defense, and content moderation firewall", price: 600.0, baseUnit: "MONTH", type: ProductType.RECURRING },
    ],
  },
  {
    name: "DevOps & CI/CD Tooling",
    description: "Continuous integration, container registries, code analysis, and release management",
    products: [
      { name: "Apex CI/CD Enterprise Runner Fleet 10x", description: "10 dedicated high-speed build runners with caching, docker daemon, and iOS support", price: 550.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Static Code Analysis & SAST Security Scanner", description: "Multi-language static analysis scanning for security flaws, code smells, and technical debt", price: 18.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Container Registry Enterprise Storage 2TB", description: "Secure Docker/OCI artifact registry with vulnerability scanning and geographic replication", price: 190.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Infrastructure as Code Drift Detection Engine", description: "Terraform/OpenTofu state management, policy enforcement, and real-time drift alerts", price: 420.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Feature Flag & Progressive Delivery Platform", description: "Targeted user rollouts, canary releases, and real-time kill switches", price: 340.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Artifact Repository Management License", description: "Universal package manager for Maven, npm, PyPI, NuGet, and binary distributions", price: 3200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Chaos Engineering & Resilience Testing Suite", description: "Automated network latency injection, node failure simulation, and SLO validation", price: 780.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Developer Cloud Workstation Remote Container", description: "Dedicated cloud development container with VSCode web interface and 32GB RAM", price: 85.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Release Orchestration & Governance Gateway", description: "Multi-environment pipeline gate approvals, audit trails, and compliance reporting", price: 650.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Git Repository Server Enterprise Appliance", description: "High availability on-premises Git server with branch protection and code review tools", price: 6400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
  {
    name: "Enterprise Rack Servers",
    description: "1U, 2U, and 4U density optimized rackmount servers for datacenter workloads",
    products: [
      { name: "Apex PowerServer 1U Dual Intel Xeon Silver", description: "1U chassis, 2x Intel Xeon Silver 4410Y, 128GB DDR5 ECC, 2x 960GB NVMe RAID1", price: 4200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex PowerServer 2U Dual AMD EPYC 9354", description: "2U chassis, 2x 32-core EPYC 9354, 256GB DDR5, 8x 3.84TB SAS SSD Hot-Swap", price: 9800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex High-Density 4U Quad-Socket Platinum Server", description: "4U chassis, 4x Intel Xeon Platinum 8480+, 1TB DDR5 ECC, redundant 2400W Titanium PSUs", price: 28500.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex Edge Micro-Server 1U Fanless Ruggedized", description: "1U fanless wide-temperature industrial server with dual 10GbE SFP+ ports", price: 3100.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex Storage-Dense 2U 24-Bay NVMe Server", description: "2U all-flash storage server supporting 24x U.2 NVMe SSDs with PCIe Gen5 switch", price: 16400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Server Out-of-Band IPMI Enterprise License", description: "HTML5 virtual KVM, virtual media mounting, and power telemetry firmware license", price: 180.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Server Rail Kit Rapid-Deploy 19-Inch", description: "Tool-less sliding rail kit compatible with standard 4-post square hole server racks", price: 120.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Redundant Hot-Swap Power Supply Unit 1600W", description: "80 Plus Titanium 96% efficiency hot-plug power supply unit with PMBus support", price: 340.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Server Memory Upgrade Kit 128GB DDR5 ECC", description: "2x 64GB DDR5-5600 Registered ECC server DIMM modules", price: 720.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Hardware RAID Controller 12Gbps 8-Port SAS", description: "PCIe 4.0 SAS/SATA RAID controller with 4GB Flash-Backed Write Cache (FBWC)", price: 890.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
  {
    name: "Network Switches & Routing",
    description: "Core, aggregation, leaf-spine switches, optical transceivers, and SD-WAN routers",
    products: [
      { name: "Apex Core Spine Switch 32x 100GbE QSFP28", description: "Non-blocking 3.2 Tbps datacenter spine switch running open network OS (SONiC)", price: 11200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex Top-of-Rack Leaf Switch 48x 25GbE + 6x 100GbE", description: "Ultra low latency leaf switch with VXLAN EVPN hardware gateway support", price: 7400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex PoE+ Access Switch 48-Port Gigabit + 4x 10G SFP+", description: "Layer 3 managed PoE+ switch delivering 740W power budget for IP phones and APs", price: 2300.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex SD-WAN Branch Gateway Router", description: "Multi-WAN failover router with dynamic path selection, IPsec VPN, and LTE backup", price: 1650.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Enterprise Wi-Fi 7 Tri-Band Access Point", description: "802.11be indoor access point with 4x4 MU-MIMO and 10GbE uplink port", price: 680.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Optical Transceiver Module 100G QSFP28 LR4", description: "Single-mode 1310nm optical transceiver module for up to 10km link distance", price: 380.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Optical Transceiver Module 25G SFP28 SR", description: "Multimode 850nm optical transceiver module for up to 100m OM4 fiber", price: 95.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Direct Attach Copper Cable (DAC) 100G 2m", description: "Passive copper twinax cable with QSFP28 connectors for rack interconnections", price: 65.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Network Packet Broker TAP Aggregator 1U", description: "Network visibility appliance for aggregating, filtering, and load balancing SPAN ports", price: 5400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Cloud Managed SD-WAN Controller Subscription", description: "Centralized cloud orchestration and traffic analytics portal per gateway", price: 80.0, baseUnit: "MONTH", type: ProductType.RECURRING },
    ],
  },
  {
    name: "Enterprise Storage & SAN",
    description: "All-flash SAN arrays, high-density NAS storage, backup appliances, and LTO tape libraries",
    products: [
      { name: "Apex All-Flash SAN Storage Array 50TB Raw", description: "Dual-controller active-active NVMe-oF SAN array with sub-millisecond 1M IOPS", price: 32000.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex Enterprise Hybrid NAS 12-Bay 120TB", description: "ZFS-based rackmount NAS with 10GbE SFP+ and hardware deduplication", price: 11500.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Expansion Disk Enclosure JBOD 24-Bay SAS", description: "2U 24x 2.5-inch 12Gbps SAS daisy-chain expansion shelf", price: 3400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Immutable Ransomware-Proof Backup Appliance", description: "Write-Once-Read-Many (WORM) storage appliance with air-gapped replication", price: 14200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "LTO-9 Tape Autoloader 24-Slot 432TB", description: "Automated SAS tape library for ultra-long term cold archive and compliance", price: 8900.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Enterprise NVMe SSD 7.68TB U.2 Read-Intensive", description: "PCIe 4.0 enterprise solid state drive with power loss protection", price: 820.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Enterprise Hard Drive 20TB SAS 7200 RPM 3.5-Inch", description: "Helium-sealed CMR enterprise disk drive for large-scale storage arrays", price: 440.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Fibre Channel Host Bus Adapter (HBA) Dual-Port 32G", description: "PCIe 4.0 Dual-port 32Gb Fibre Channel optical adapter for SAN connectivity", price: 1250.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Global Cloud S3 Storage Tier 10TB Tier", description: "Durable multi-region object storage with 99.999999999% data resiliency", price: 210.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Storage Management & Replication Software License", description: "Snapshots, thin provisioning, asynchronous remote mirroring per controller", price: 4500.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
  {
    name: "Engineering Workstations",
    description: "Tower and rackmount workstations for CAD, 3D rendering, simulation, and software development",
    products: [
      { name: "Apex Pro Workstation Tower Core i9 64GB", description: "Intel Core i9-14900K, 64GB DDR5, RTX 4080 16GB, 2TB PCIe Gen4 SSD", price: 3400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex Ultra Workstation Dual Xeon 256GB RTX 6000", description: "Intel Xeon w9-3495X 56-core, 256GB ECC, NVIDIA RTX 6000 Ada 48GB, liquid cooled", price: 13500.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex Mobile Workstation Laptop 16-Inch OLED", description: "Intel Core Ultra 9, 32GB RAM, RTX 4070, 4K 120Hz OLED color-calibrated display", price: 2850.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Apex Compact Thin Client Terminal V3", description: "Quad-core fanless thin client supporting dual 4K monitors and Citrix/VMware protocols", price: 420.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Thunderbolt 4 Enterprise Docking Station Dual 4K", description: "180W power delivery dock with dual DisplayPort, HDMI, 2.5GbE LAN, and 4x USB-C", price: 280.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Professional 32-Inch 4K IPS HDR Monitor", description: "100% sRGB / 98% DCI-P3 factory calibrated monitor with USB-C 90W charging hub", price: 790.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Ergonomic Mechanical Keyboard & Precision Mouse Set", description: "Wireless silent tactile mechanical switch keyboard and customizable ergonomic mouse", price: 175.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Workstation ECC Memory Upgrade 64GB DDR5", description: "2x 32GB DDR5-5600 workstation grade ECC unbuffered memory kit", price: 380.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Remote Workstation Access Software Host License", description: "Ultra-low latency 60fps 4:4:4 color accurate remote pixel streaming software", price: 35.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Triple Monitor Articulating Heavy-Duty Desk Mount", description: "Gas-spring monitor arms supporting up to three 32-inch displays with cable management", price: 160.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
  {
    name: "Collaboration & AV Systems",
    description: "Smart conference room systems, interactive whiteboards, acoustic soundbars, and beamforming mics",
    products: [
      { name: "Apex Smart Conference Room Video Bar 4K", description: "All-in-one motorized PTZ 4K camera with 8-element beamforming mic array and stereo speakers", price: 2100.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Interactive 75-Inch 4K Touch Whiteboard Display", description: "Zero-bonding infrared 40-point touch screen with anti-glare glass and stylus pen kit", price: 3600.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Tabletop Conference Room Touch Controller 10-Inch", description: "PoE connected touch console for one-touch meeting join and room environmental controls", price: 850.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Ceiling Mounted Dante Beamforming Microphone Array", description: "Steerable pickup zones with AEC (Acoustic Echo Cancellation) and Dante audio networking", price: 2400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Wireless Content Presentation Gateway 4K", description: "Screen casting hardware receiver supporting AirPlay, Miracast, and USB dongle pairing", price: 620.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Noise-Cancelling Wireless Executive Headset", description: "Active noise cancelling Bluetooth headset with boom mic and wireless charging stand", price: 240.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Room Scheduling Display Panel 8-Inch PoE", description: "Door-side room availability indicator LED with calendar sync for Google Workspace / O365", price: 460.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Conference Room Pro Audio DSP Processor", description: "12-channel digital signal processor with USB audio interface and VoIP telephony", price: 1850.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Enterprise Virtual Meeting Room SaaS License", description: "Host up to 500 participants with cloud recording, automated transcripts, and breakout rooms", price: 22.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Mobile AV Cart with Motorized Height Adjustment", description: "Heavy-duty locking wheel cart for displays up to 86 inches with integrated power strip", price: 950.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
  {
    name: "Industrial Edge Computing",
    description: "Rugged IoT gateways, DIN-rail automation controllers, serial device servers, and sensors",
    products: [
      { name: "Rugged DIN-Rail IoT Gateway Quad-Core", description: "Wide-temp -40C to 75C industrial gateway with RS-485, CAN bus, and dual SIM LTE", price: 890.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Industrial Managed Ethernet Switch 8-Port Gigabit", description: "DIN-rail mounted IP30 redundant 24V DC power switch for factory automation", price: 480.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Serial Device Server 4-Port RS-232/422/485", description: "Ethernet to serial converter with 15kV ESD surge protection for legacy machinery", price: 340.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Modbus TCP to MQTT Protocol Converter", description: "Edge translation gateway converting SCADA telemetry into cloud IoT MQTT streams", price: 520.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Industrial Edge AI Box Jetson Orin 32GB", description: "IP67 sealed rugged embedded computer for automated visual inspection on factory lines", price: 2750.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Wireless Vibration & Temperature Sensor Node 5-Pack", description: "Battery powered LoRaWAN predictive maintenance sensors for rotating industrial motors", price: 650.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Industrial LoRaWAN Gateway IP67 Outdoor", description: "8-channel outdoor long-range gateway with GPS synchronization and PoE power", price: 1100.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Edge Device Fleet Management Cloud License", description: "Over-the-air firmware updates, container provisioning, and remote telemetry per device", price: 8.5, baseUnit: "NODE", type: ProductType.RECURRING },
      { name: "Industrial UPS Power Backup 500W DIN-Rail", description: "Supercapacitor based maintenance-free short term power bridge for PLC controllers", price: 590.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "NEMA 4X Sealed Outdoor Equipment Enclosure", description: "Stainless steel weatherproof enclosure with internal heating/cooling thermostat", price: 780.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
  {
    name: "Datacenter Power & Cooling",
    description: "Online double-conversion UPS, intelligent metered rack PDUs, ATS switches, and airflow containment",
    products: [
      { name: "Online Double-Conversion Rack UPS 10kVA 3U", description: "High-density 10,000VA / 10,000W power supply with hot-swappable battery modules and SNMP", price: 5600.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Intelligent Switched PDU 24-Outlet 30A 208V", description: "Per-outlet power metering, remote on/off rebooting, and environmental sensor ports", price: 1150.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Automatic Transfer Switch (ATS) 1U 16A Dual Input", description: "Seamless 8ms power source switching between utility grid and emergency generator lines", price: 720.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Server Rack Enclosure 42U Standard Depth 1070mm", description: "Perforated high-airflow steel server cabinet with cable management and combination locks", price: 1450.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "In-Row Precision Air Cooling Unit 10kW DX", description: "Variable speed inverter compressor cooling unit designed for dense hot-aisle containment", price: 12800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Extended Battery Pack Module 3U for 10kVA UPS", description: "Daisy-chainable sealed lead acid battery expansion cabinet for runtime extension", price: 1950.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Modular Hot Aisle Containment Roof & Door Kit", description: "Modular ceiling panels and sliding end doors to eliminate hot/cold air mixing", price: 3200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Datacenter Environmental Monitor Sensor Hub", description: "Temperature, humidity, water leak, and smoke detector hub with email/SMS alerting", price: 480.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "High-Capacity Server Rack Grounding Busbar Kit", description: "Electro-tin plated copper grounding bar with mounting hardware for 42U rack chassis", price: 95.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "DCIM Power & Environmental Telemetry Cloud License", description: "Real-time PUE calculations, 3D rack thermal mapping, and capacity forecasting", price: 350.0, baseUnit: "MONTH", type: ProductType.RECURRING },
    ],
  },
  {
    name: "Unified Telecom & VoIP",
    description: "Cloud PBX systems, SIP trunking, IP executive desk phones, and call center routing",
    products: [
      { name: "Apex Cloud PBX Enterprise Seat License", description: "Unlimited domestic calling, visual voicemail, IVR menus, call recording, and CRM integration", price: 28.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Executive IP Touchscreen Desk Phone 7-Inch", description: "Gigabit color touch IP phone with Android OS, Bluetooth, HD audio, and 16 SIP accounts", price: 290.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Gigabit Mid-Range IP Desk Phone 6-Line", description: "Dual port PoE IP phone with backlit LCD, 24 customizable digital BLF keys", price: 140.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Enterprise Session Border Controller (SBC) Appliance", description: "1000 concurrent SIP sessions hardware security gateway protecting VoIP network", price: 4900.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Analog Telephone Adapter (ATA) 4-Port FXS", description: "VoIP gateway adapter allowing legacy fax machines and analog phones to connect to SIP PBX", price: 180.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Elastic SIP Trunking Channel Package (20 Channels)", description: "High availability SIP trunk bundle with burstable capacity and global DID numbers", price: 220.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Contact Center Omnichannel Inbound Agent License", description: "Skill-based routing, real-time whisper coaching, sentiment analysis, and queue analytics", price: 75.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "DECT IP Cordless Handset & Base Station Bundle", description: "Long-range wireless phone system covering up to 50,000 sq ft warehouse floor space", price: 380.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "VoIP Call Quality Monitoring & Diagnostic Probe", description: "Continuous MOS score calculation, jitter, packet loss diagnostic hardware probe", price: 850.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Toll-Free Inbound Voice Routing Number Tier", description: "Enterprise vanity toll-free 1-800 number allocation with 5,000 bundled minutes", price: 120.0, baseUnit: "MONTH", type: ProductType.RECURRING },
    ],
  },
  {
    name: "Observability & APM Software",
    description: "Distributed tracing, metrics aggregation, log analytics, synthetic checks, and SLO monitoring",
    products: [
      { name: "Apex Full-Stack Observability Host Agent License", description: "Automated APM, distributed OpenTelemetry tracing, and JVM/.NET profiling per server", price: 65.0, baseUnit: "NODE", type: ProductType.RECURRING },
      { name: "Log Aggregation & Search Storage 500GB/Mo", description: "Indexed structured logging storage with sub-second query latency and 30-day retention", price: 250.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Global Synthetic Monitoring & Endpoint Uptime Checks", description: "Multi-location HTTP, browser click-stream, and DNS checks executed every 60 seconds", price: 110.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Real User Monitoring (RUM) 1M Pageviews", description: "Client-side Core Web Vitals, JavaScript error tracking, and session replay analytics", price: 180.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Database Performance Analyzer License", description: "Query plan regression detection, lock contention analysis, and indexing recommendations", price: 800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "AIOps Incident Correlation & Noise Reduction Platform", description: "Machine learning alert clustering, root cause analysis, and automated PagerDuty routing", price: 540.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Network Flow Analyzer (NetFlow / sFlow Collector)", description: "Real-time bandwidth utilization and top-talker protocol inspection server license", price: 1900.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Serverless Function Tracing & Cost Profiler", description: "Cold start detection, execution latency breakdown for AWS Lambda / GCP Functions", price: 95.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Custom Metric Ingestion Package (100,000 Metrics)", description: "High-resolution 10-second Prometheus / StatsD metric time-series data storage", price: 150.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Compliance Log Long-Term Cold Archive 5TB", description: "Immutable S3 Glacier compatible log archiving for SOC2 and HIPAA regulatory compliance", price: 80.0, baseUnit: "MONTH", type: ProductType.RECURRING },
    ],
  },
  {
    name: "Container & Kubernetes Engines",
    description: "Managed Kubernetes clusters, service mesh controllers, container runtime security, and ingress",
    products: [
      { name: "Apex Managed Kubernetes Master Control Plane", description: "Fully managed multi-zone HA Kubernetes control plane with automated etcd backups and upgrades", price: 150.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Kubernetes Worker Node Tier: 32-Core 128GB RAM", description: "Dedicated managed node instance optimized for high-density container scheduling", price: 620.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Enterprise Service Mesh (Istio) Management Portal", description: "mTLS traffic encryption, fine-grained canary splitting, and visual service topology", price: 450.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Container Runtime Security & Vulnerability Guard", description: "eBPF based kernel runtime anomaly detection and blocked syscall enforcement per node", price: 40.0, baseUnit: "NODE", type: ProductType.RECURRING },
      { name: "Kubernetes Backup & Disaster Recovery Operator", description: "Automated persistent volume snapshotting and cross-region cluster restore engine", price: 290.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Cloud Native Storage (CSI) Distributed SDS 10TB", description: "Software defined block storage layer for Kubernetes stateful sets with replication", price: 480.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "GitOps Continuous Deployment Operator License", description: "ArgoCD / Flux enterprise wrapper with role-based access control and multi-cluster sync", price: 320.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Container Image Vulnerability & SBOM Scanner", description: "Static container layer inspection, license compliance verification, and CVE patching alerts", price: 210.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "API Gateway & Ingress Controller Enterprise", description: "Rate limiting, OAuth2 authentication plugins, and gRPC routing for Kubernetes ingress", price: 580.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Kubernetes Cost Allocation & Optimization Engine", description: "Container level resource right-sizing recommendations and multi-tenant billing breakdown", price: 190.0, baseUnit: "MONTH", type: ProductType.RECURRING },
    ],
  },
  {
    name: "Enterprise SaaS Applications",
    description: "Cloud ERP, CRM modules, human resource information systems, and contract management",
    products: [
      { name: "DealFlow360 Enterprise Sales & Quotation Suite", description: "Automated quotation approvals, multi-tier pricing, deal health telemetry, and client negotiation portal", price: 65.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Enterprise Customer Relationship Management (CRM) Seat", description: "Opportunity tracking, pipeline forecasting, email sequencing, and territory management", price: 48.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "ERP Financial General Ledger & Invoicing Module", description: "Multi-currency ledger, accounts receivable/payable automation, and automated tax reporting", price: 850.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Supply Chain & Warehouse Inventory Management Module", description: "Multi-warehouse stock transfers, lot tracking, barcode scanning, and reorder automations", price: 620.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Digital Signature & Contract Lifecycle Manager", description: "Legally binding e-signatures, document audit trails, and automated renewal reminders", price: 24.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "HRIS & Global Payroll Automation License", description: "Employee onboarding, time tracking, benefits administration, and tax withholding", price: 12.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Customer Support Helpdesk & Ticketing Pro", description: "Multi-channel ticketing, SLA escalation timers, automated knowledge base, and CSAT surveys", price: 38.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Procurement & Vendor Management Portal", description: "Purchase order approval workflows, 3-way invoice matching, and vendor compliance tracking", price: 490.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Enterprise Project Portfolio Management Suite", description: "Gantt charts, resource allocation capacity planning, and billable time tracking", price: 28.0, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Executive Business Intelligence & Dashboard Studio", description: "Custom SQL dashboards, scheduled executive PDF reports, and embedded analytics", price: 42.0, baseUnit: "SEAT", type: ProductType.RECURRING },
    ],
  },
  {
    name: "Security Operations & SIEM",
    description: "Managed security operations, threat hunting, MDR services, and forensic investigation tooling",
    products: [
      { name: "Managed Detection and Response (MDR) 24x7 SOC Coverage", description: "24/7 continuous threat monitoring and active containment by certified security analysts", price: 35.0, baseUnit: "NODE", type: ProductType.RECURRING },
      { name: "Security Orchestration & Automated Response (SOAR) Engine", description: "Automated playbook execution for phishing triage, IP blocking, and host isolation", price: 1100.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Cyber Threat Intelligence Feed Subscription", description: "Real-time feed of malicious IPs, domains, file hashes, and dark web credential leaks", price: 750.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Digital Forensics & Incident Response (DFIR) Toolset", description: "Live memory capture, disk timeline reconstruction, and forensic image analysis suite", price: 4200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Breach & Attack Simulation (BAS) Platform", description: "Continuous MITRE ATT&CK technique validation against internal security controls", price: 890.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Employee Security Awareness & Phishing Simulation", description: "Automated simulated phishing campaigns and interactive micro-training modules", price: 4.5, baseUnit: "SEAT", type: ProductType.RECURRING },
      { name: "Deception Technology Honeypot Network", description: "Decoy servers, credentials, and breadcrumbs to detect internal lateral movement", price: 680.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "External Attack Surface Management (EASM) Scanner", description: "Continuous discovery of exposed ports, expired certificates, and leaked API keys", price: 520.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Retainer Package: Emergency Incident Response 40 Hours", description: "Pre-funded 4-hour SLA emergency response retainer for cybersecurity incidents", price: 12000.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Regulatory Compliance Audit Readiness Kit (SOC2/ISO27001)", description: "Automated evidence collection, policy templates, and continuous gap analysis", price: 950.0, baseUnit: "MONTH", type: ProductType.RECURRING },
    ],
  },
  {
    name: "Professional Consulting Services",
    description: "Architecture design, cloud migration engineering, security audits, and staff augmentation",
    products: [
      { name: "Principal Cloud Solutions Architect Consulting (80 Hours)", description: "Enterprise architecture blueprint, cloud readiness assessment, and migration roadmap", price: 16000.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Senior DevOps & Infrastructure Automation Engineer (160 Hours)", description: "Full-time 1-month engineer allocation for Terraform, Kubernetes, and CI/CD pipelines", price: 24000.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Comprehensive White-Box Penetration Test (1 Application)", description: "Manual source code review, dynamic application testing, and executive remediation report", price: 9500.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Database Performance Tuning & Optimization Engagement", description: "Index optimization, query refactoring, lock analysis, and configuration tuning (40h)", price: 7500.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Datacenter Migration On-Site Engineering Lead", description: "Physical server rack installation, structured cabling verification, and cutover execution", price: 8200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Fractional Chief Information Security Officer (vCISO) Retainer", description: "Strategic security roadmap, board presentations, and vendor risk assessments (20h/mo)", price: 4500.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "AI/ML Model Architecture Design & Feasibility Study", description: "Data pipeline audit, model selection, fine-tuning strategy, and compute cost modeling", price: 11000.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Custom API Integration Engineering Sprint (2 Weeks)", description: "Dedicated development sprint integrating DealFlow360 with legacy custom ERP/CRM", price: 12500.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Corporate IT Disaster Recovery Tabletop Simulation", description: "Facilitated executive disaster exercise with failover testing and action plan documentation", price: 6000.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Kubernetes Security Hardening & CIS Benchmark Audit", description: "Cluster posture assessment, network policy deployment, and pod security admission rules", price: 5800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
  {
    name: "24x7 Mission Critical Support",
    description: "Premium SLA agreements, designated technical account managers, and emergency response",
    products: [
      { name: "Apex Platinum Support Plan: 15-Minute Emergency SLA", description: "24x7x365 direct phone access to senior L3 engineering team with 15-minute response SLA", price: 3200.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Apex Gold Support Plan: 1-Hour Severity-1 SLA", description: "24x7 ticket and phone support with 1-hour response time for critical production outages", price: 1600.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Designated Technical Account Manager (TAM) Service", description: "Named senior engineer conducting quarterly reviews, proactive health checks, and escalations", price: 2200.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "On-Call Production Outage Triage Engineering Block", description: "Prepaid 20 hours block for off-hours emergency troubleshooting and root cause analysis", price: 4800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Proactive Infrastructure Health & Patch Management", description: "Scheduled monthly OS kernel updates, security patches, and firmware upgrades", price: 850.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Disaster Recovery Standby Engineering Team Guarantee", description: "Guaranteed 30-minute response standby team during scheduled maintenance windows", price: 1400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Priority Support Ticket Queue Upgrade", description: "Fast-track ticket routing bypassing tier-1 support directly to tier-2 specialist engineers", price: 500.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "VIP Executive White-Glove Support Add-On", description: "Dedicated instant messaging Slack/Teams channel directly with lead system architects", price: 1250.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Monthly Architecture & Cost Optimization Review", description: "Deep-dive analysis of resource utilization, idle assets, and cloud reservation planning", price: 750.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Annual Comprehensive Infrastructure Health Check", description: "Holistic audit of datacenter configurations, backup integrity, and network saturation", price: 4200.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
  {
    name: "Hardware Warranty & SLA Maintenance",
    description: "4-hour on-site parts replacement, defective media retention, and lifecycle management",
    products: [
      { name: "Apex 4-Hour On-Site Parts Replacement Warranty 3-Year", description: "3-Year 24x7 4-hour on-site mission critical hardware replacement with field technician", price: 3800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Next Business Day (NBD) Parts Delivery Warranty 3-Year", description: "Advance parts replacement shipped next business day with return shipping labels", price: 1400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Keep Your Hard Drive (Defective Media Retention) 3-Year", description: "Retain failed magnetic disks and SSDs for internal secure destruction without warranty penalty", price: 450.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Datacenter Hardware Decommissioning & Data Sanitization", description: "NIST 800-88 compliant 3-pass disk wiping, physical shredding, and disposal certificate", price: 1800.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Extended Warranty Extension Year 4 and 5", description: "Post-warranty lifecycle extension covering motherboard, power supplies, and storage chassis", price: 2100.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "On-Site Spare Parts Kit (Spares in the Air)", description: "On-premise locked cabinet containing spare DIMMs, hot-swap fans, drives, and power supplies", price: 2900.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Firmware Lifecycle Management & Safety Testing Service", description: "Pre-tested microcode and BIOS validation before rollout to mission-critical hosts", price: 650.0, baseUnit: "MONTH", type: ProductType.RECURRING },
      { name: "Power Supply & Battery Preventative Replacement Cycle", description: "Scheduled proactive replacement of UPS battery packs before end of design life", price: 1650.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Datacenter Rack Re-cabling & Thermal Rebalancing", description: "Professional airflow remediation, cable combing, and label mapping service", price: 2400.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
      { name: "Asset Tagging & Hardware Tracking Compliance Audit", description: "Barcode/RFID asset tracking audit and automated CMDB reconciliation", price: 1500.0, baseUnit: "UNIT", type: ProductType.ONE_TIME },
    ],
  },
];

const WAREHOUSE_DEFINITIONS = [
  {
    name: "North American Central Hub - Chicago",
    country: "United States",
    postalCode: "60601",
    addressLine: "100 Logistics Blvd, Suite 400, Chicago, IL",
  },
  {
    name: "US East Coast Gateway - Newark",
    country: "United States",
    postalCode: "07102",
    addressLine: "250 Harbor Way, Terminal B, Newark, NJ",
  },
  {
    name: "US West Coast Terminal - Oakland",
    country: "United States",
    postalCode: "94607",
    addressLine: "450 Maritime St, Dock 12, Oakland, CA",
  },
  {
    name: "US South Central Distribution - Dallas",
    country: "United States",
    postalCode: "75201",
    addressLine: "800 Freight Ave, Bldg 3, Dallas, TX",
  },
  {
    name: "European Central Depot - Frankfurt",
    country: "Germany",
    postalCode: "60311",
    addressLine: "Industriestrasse 12-16, 60311 Frankfurt am Main",
  },
  {
    name: "UK & Ireland Distribution - London",
    country: "United Kingdom",
    postalCode: "EC1A 1BB",
    addressLine: "15 Thames Wharf, Docklands, London",
  },
  {
    name: "Asia-Pacific Central Depot - Singapore",
    country: "Singapore",
    postalCode: "018981",
    addressLine: "10 Marina Blvd, Marina Bay Hub, Singapore",
  },
  {
    name: "East Asia Distribution Center - Tokyo",
    country: "Japan",
    postalCode: "100-0001",
    addressLine: "2-1 Chiyoda, Distribution Zone 4, Tokyo",
  },
  {
    name: "Oceania Operations Hub - Sydney",
    country: "Australia",
    postalCode: "2000",
    addressLine: "50 George St, Logistics District, Sydney NSW",
  },
  {
    name: "Latin America Fulfillment Center - Sao Paulo",
    country: "Brazil",
    postalCode: "01000-000",
    addressLine: "Av. Paulista 1000, Galpao 8, Sao Paulo - SP",
  },
];

const COMPANY_NAMES = [
  "DealFlow Apex Technologies", // Primary Showcase Company (Index 0)
  "Nordic Dynamics AB",
  "Tokyo Synergy Systems Corp",
  "Starlight Infrastructure Inc",
  "OmniCorp Global Solutions",
  "Initech Software Enterprise",
  "Pied Piper Distributed Cloud",
  "Hooli Enterprise Systems",
  "Massive Dynamic Labs",
  "Wayne Enterprise Technologies",
  "Stark Industrial Solutions",
  "Cyberdyne Cyber Systems",
  "Soylent Logistics International",
  "Umbrella Global BioTech",
  "Aperture Science Software",
  "Tyrell Advanced Data Corp",
  "Weyland-Yutani Industrial",
  "Wonka Global Supply Chain",
  "Gekko Capital Technology",
  "Sterling Cooper Digital",
  "Prestige Worldwide Technologies",
  "Dunder Mifflin Enterprise Data",
  "Vandelay Global Solutions",
  "Globex International Cloud",
  "Acme Corporation Solutions",
  "Oscorp Advanced Technologies",
  "InGen Global Systems",
  "Los Pollos Logistics Corp",
  "Nakatomi Trading & Tech",
  "Blue Sun Corporation",
  "Tarsonis Global Networks",
  "Gorgon Freight Systems",
  "Anvil Aerospace Solutions",
  "RSI Logistics International",
  "Aegis Dynamics Europe",
  "Drake Interplanetary Systems",
  "Origin Jumpworks Global",
  "MISC Industrial Corporation",
  "Crusader Tech Industries",
  "Consolidated Outland Systems",
  "Argo Astronautics Logistics",
  "Krupp Industrial Data",
  "Bavaria Motoren Systems",
  "Vortex Digital Networks",
  "Helios Energy Tech",
  "Titan Cloud Systems",
  "Zenith Enterprise Computing",
  "Orion Global Telecom",
  "Nova Software Laboratories",
  "Quantum Leap Solutions",
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "Japan",
  "Canada",
  "Australia",
  "France",
  "Netherlands",
  "Singapore",
  "Switzerland",
  "Sweden",
  "Brazil",
  "India",
];

export async function resetDatabase() {
  console.log("Truncating existing database tables safely...");
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "subscription_periods",
      "subscription_items",
      "subscription_pricings",
      "subscriptions",
      "invoice_items",
      "invoices",
      "backorder_items",
      "backorders",
      "delivery_items",
      "deliveries",
      "sales_order_items",
      "sales_orders",
      "negotiation_items",
      "negotiations",
      "quotation_revision_items",
      "quotation_revisions",
      "quotation_items",
      "quotations",
      "deals",
      "product_discount_tiers",
      "product_stocks",
      "category_products",
      "products",
      "categories",
      "warehouses",
      "company_configs",
      "company_settings",
      "company_users",
      "companies",
      "auth_tokens",
      "refresh_tokens",
      "verification_tokens",
      "users"
    CASCADE;
  `);
  console.log("All tables truncated successfully.");
}

export async function seedAll() {
  console.log("Starting DealFlow360 database seed...");

  await resetDatabase();

  const hashedPassword = await bcrypt.hash(SEEDED_PASSWORD, 10);

  // --------------------------------------------------------------------------
  // 1. CREATE 100 USERS
  // --------------------------------------------------------------------------
  console.log("Creating 100 users...");

  // Primary Admin User
  const primaryAdminData = {
    userName: "Alex Vance (Admin)",
    email: "admin@dealflow.com",
    password: hashedPassword,
    authBy: AuthProvider.LOCAL,
    isEmailVerified: true,
    role: UserRole.ADMIN,
  };

  // 9 Primary Staff Members
  const primaryStaffData = [
    { userName: "Sarah Connor (Sales Manager)", email: "sales.manager1@dealflow.com", role: UserRole.USER },
    { userName: "Marcus Vance (Sales Manager)", email: "sales.manager2@dealflow.com", role: UserRole.USER },
    { userName: "Rachel Green (Sales Rep)", email: "sales.rep1@dealflow.com", role: UserRole.USER },
    { userName: "David Ross (Sales Rep)", email: "sales.rep2@dealflow.com", role: UserRole.USER },
    { userName: "Emily Watson (Sales Rep)", email: "sales.rep3@dealflow.com", role: UserRole.USER },
    { userName: "James Miller (Sales Rep)", email: "sales.rep4@dealflow.com", role: UserRole.USER },
    { userName: "Olivia Davis (Sales Rep)", email: "sales.rep5@dealflow.com", role: UserRole.USER },
    { userName: "Gordon Freeman (Finance Manager)", email: "finance.manager1@dealflow.com", role: UserRole.USER },
    { userName: "Elena Fisher (Finance Manager)", email: "finance.manager2@dealflow.com", role: UserRole.USER },
  ];

  // 30 Primary Company Dedicated Customers
  const customerNames = [
    "Apex Solutions Client", "Beacon Tech Client", "Cascade Systems Client", "Delta Innovations Client",
    "Echo Global Client", "Frontier Dynamics Client", "Genesis Tech Client", "Horizon Data Client",
    "Infinity Software Client", "Jupiter Systems Client", "Keystone Digital Client", "Legacy Networks Client",
    "Monolith Cloud Client", "Nexus Enterprise Client", "Omni Digital Client", "Pinnacle Software Client",
    "Quantum Dynamics Client", "Radiant Systems Client", "Summit Cloud Client", "Titan Enterprise Client",
    "Unity Tech Client", "Vanguard Systems Client", "Wave Dynamics Client", "Xenon Cloud Client",
    "Yield Systems Client", "Zenith Data Client", "Aura Networks Client", "Borealis Tech Client",
    "Cipher Cloud Client", "Dragonfly Systems Client"
  ];

  const primaryCustomerData = customerNames.map((name, index) => ({
    userName: name,
    email: `customer${index + 1}@clientcorp.com`,
    role: UserRole.USER,
  }));

  // 49 Company Owners (for other 49 companies)
  const otherOwnerData = Array.from({ length: 49 }, (_, index) => ({
    userName: `Executive Owner ${index + 1}`,
    email: `owner${index + 1}@enterprise-net.com`,
    role: UserRole.USER,
  }));

  // 11 Floating Users
  const floatingUserData = Array.from({ length: 11 }, (_, index) => ({
    userName: `Global Collaborator ${index + 1}`,
    email: `user${index + 1}@global-freelance.org`,
    role: UserRole.USER,
  }));

  // Combine all users to create 100 users
  const allUserSpecs = [
    primaryAdminData,
    ...primaryStaffData.map(u => ({ ...u, password: hashedPassword, authBy: AuthProvider.LOCAL, isEmailVerified: true })),
    ...primaryCustomerData.map(u => ({ ...u, password: hashedPassword, authBy: AuthProvider.LOCAL, isEmailVerified: true })),
    ...otherOwnerData.map(u => ({ ...u, password: hashedPassword, authBy: AuthProvider.LOCAL, isEmailVerified: true })),
    ...floatingUserData.map(u => ({ ...u, password: hashedPassword, authBy: AuthProvider.LOCAL, isEmailVerified: true })),
  ];

  if (allUserSpecs.length !== 100) {
    throw new Error(`Expected 100 users, got ${allUserSpecs.length}`);
  }

  const createdUsers = [];
  for (const userSpec of allUserSpecs) {
    const u = await prisma.user.create({ data: userSpec });
    createdUsers.push(u);
  }
  console.log(`Created ${createdUsers.length} users.`);

  const primaryAdmin = createdUsers[0];
  const primaryStaff = createdUsers.slice(1, 10);
  const primaryCustomers = createdUsers.slice(10, 40);
  const otherOwners = createdUsers.slice(40, 89);
  // floatingUsers = createdUsers.slice(89, 100);

  // --------------------------------------------------------------------------
  // 2. CREATE 50 COMPANIES
  // --------------------------------------------------------------------------
  console.log("Creating 50 companies...");

  const createdCompanies = [];

  // 2.1 Primary Showcase Company (DealFlow Apex Technologies)
  const primaryCompany = await prisma.company.create({
    data: {
      name: COMPANY_NAMES[0],
      ownerId: primaryAdmin.id,
      currency: "USD",
      status: CompanyStatus.ACTIVE,
      country: "United States",
      postalCode: "94016",
      addressLine: "100 Innovation Way, Suite 500, San Francisco, CA",
    },
  });
  createdCompanies.push(primaryCompany);

  // Settings and configs for primary company
  await prisma.companySetting.create({
    data: {
      companyId: primaryCompany.id,
      customerDiscountTier: {
        BRONZE: 5,
        SILVER: 10,
        GOLD: 18,
      },
    },
  });

  await prisma.companyConfig.createMany({
    data: [
      { companyId: primaryCompany.id, configKey: "max_discount_allowed", configValue: "25" },
      { companyId: primaryCompany.id, configKey: "auto_approval_threshold", configValue: "5000" },
      { companyId: primaryCompany.id, configKey: "high_risk_threshold", configValue: "50000" },
      { companyId: primaryCompany.id, configKey: "default_payment_terms", configValue: "NET_30" },
    ],
  });

  // 2.2 Create Remaining 49 Companies
  for (let i = 1; i < 50; i++) {
    const owner = otherOwners[i - 1];
    const country = COUNTRIES[i % COUNTRIES.length];
    const currency = country === "United States" ? "USD" : country === "United Kingdom" ? "GBP" : country === "Japan" ? "JPY" : country === "Germany" || country === "France" || country === "Netherlands" ? "EUR" : "USD";

    const comp = await prisma.company.create({
      data: {
        name: COMPANY_NAMES[i],
        ownerId: owner.id,
        currency,
        status: CompanyStatus.ACTIVE,
        country,
        postalCode: `ZIP-${10000 + i}`,
        addressLine: `${100 + i * 5} Enterprise Parkway, Suite ${i}`,
      },
    });

    await prisma.companySetting.create({
      data: {
        companyId: comp.id,
        customerDiscountTier: {
          BRONZE: 5,
          SILVER: 10,
          GOLD: 15,
        },
      },
    });

    await prisma.companyUser.create({
      data: {
        companyId: comp.id,
        userId: owner.id,
        role: CompanyUserRole.ADMIN,
      },
    });

    createdCompanies.push(comp);
  }
  console.log(`Created ${createdCompanies.length} companies.`);

  // --------------------------------------------------------------------------
  // 3. SET UP PRIMARY COMPANY ROLES & MEMBERSHIPS
  // --------------------------------------------------------------------------
  console.log("Setting up multi-role access and staff for primary company...");

  // Admin access
  await prisma.companyUser.create({
    data: {
      companyId: primaryCompany.id,
      userId: primaryAdmin.id,
      role: CompanyUserRole.ADMIN,
    },
  });

  // Staff roles
  const staffRoleMap = [
    CompanyUserRole.SALES_MANAGER,   // Sarah Connor
    CompanyUserRole.SALES_MANAGER,   // Marcus Vance
    CompanyUserRole.SALES_REP,       // Rachel Green
    CompanyUserRole.SALES_REP,       // David Ross
    CompanyUserRole.SALES_REP,       // Emily Watson
    CompanyUserRole.SALES_REP,       // James Miller
    CompanyUserRole.SALES_REP,       // Olivia Davis
    CompanyUserRole.FINANCE_MANAGER, // Gordon Freeman
    CompanyUserRole.FINANCE_MANAGER, // Elena Fisher
  ];

  for (let i = 0; i < primaryStaff.length; i++) {
    await prisma.companyUser.create({
      data: {
        companyId: primaryCompany.id,
        userId: primaryStaff[i].id,
        role: staffRoleMap[i],
      },
    });
  }

  // 30 Customers for Primary Company (10 Gold, 10 Silver, 10 Bronze)
  console.log("Linking 30 customers to primary company with tiers...");
  for (let i = 0; i < primaryCustomers.length; i++) {
    const tier = i < 10 ? CustomerTier.GOLD : i < 20 ? CustomerTier.SILVER : CustomerTier.BRONZE;
    await prisma.companyUser.create({
      data: {
        companyId: primaryCompany.id,
        userId: primaryCustomers[i].id,
        role: CompanyUserRole.CUSTOMER,
        customerTier: tier,
      },
    });
  }

  // --------------------------------------------------------------------------
  // 4. CREATE 10 WAREHOUSES FOR PRIMARY COMPANY
  // --------------------------------------------------------------------------
  console.log("Creating 10 warehouses for primary company...");
  const createdWarehouses = [];
  for (const whSpec of WAREHOUSE_DEFINITIONS) {
    const wh = await prisma.warehouse.create({
      data: {
        companyId: primaryCompany.id,
        ...whSpec,
      },
    });
    createdWarehouses.push(wh);
  }
  console.log(`Created ${createdWarehouses.length} warehouses.`);

  // --------------------------------------------------------------------------
  // 5. CREATE 20 CATEGORIES & 200 PRODUCTS FOR PRIMARY COMPANY
  // --------------------------------------------------------------------------
  console.log("Creating 20 categories and 200 products with stock & discount tiers...");

  if (CATEGORY_DEFINITIONS.length !== 20) {
    throw new Error(`Expected 20 categories, got ${CATEGORY_DEFINITIONS.length}`);
  }

  let totalProductsCount = 0;

  for (const catDef of CATEGORY_DEFINITIONS) {
    const category = await prisma.category.create({
      data: {
        companyId: primaryCompany.id,
        name: catDef.name,
        description: catDef.description,
      },
    });

    if (catDef.products.length !== 10) {
      throw new Error(`Expected 10 products for category ${catDef.name}, got ${catDef.products.length}`);
    }

    for (const prodDef of catDef.products) {
      const product = await prisma.product.create({
        data: {
          companyId: primaryCompany.id,
          name: prodDef.name,
          description: prodDef.description,
          price: prodDef.price,
          baseUnit: prodDef.baseUnit,
          type: prodDef.type,
        },
      });
      totalProductsCount++;

      // Link Product to Category
      await prisma.categoryProduct.create({
        data: {
          productId: product.id,
          categoryId: category.id,
        },
      });

      // Link Product Stocks across all 10 Warehouses
      for (let w = 0; w < createdWarehouses.length; w++) {
        const wh = createdWarehouses[w];
        const stockQty = prodDef.type === ProductType.RECURRING ? 9999 : (w + 1) * 25 + Math.floor(Math.random() * 50);
        await prisma.productStock.create({
          data: {
            productId: product.id,
            warehouseId: wh.id,
            stockQty,
          },
        });
      }

      // Link Product Discount Tiers
      const discountTierData =
        prodDef.discountTiers && prodDef.discountTiers.length > 0
          ? prodDef.discountTiers.map((dt) => ({
              productId: product.id,
              customerTier: dt.customerTier,
              discountPercent: dt.discountPercent,
            }))
          : [
              { productId: product.id, customerTier: CustomerTier.BRONZE, discountPercent: 5.0 },
              { productId: product.id, customerTier: CustomerTier.SILVER, discountPercent: 10.0 },
              { productId: product.id, customerTier: CustomerTier.GOLD, discountPercent: 18.0 },
            ];

      await prisma.productDiscountTier.createMany({
        data: discountTierData,
      });
    }
  }

  console.log(`Created 20 categories and ${totalProductsCount} products.`);

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log("====================================================================");
  console.log("               DEALFLOW360 SEED COMPLETED SUCCESSFULLY               ");
  console.log("====================================================================");
  console.log(`Total Users Created:       ${createdUsers.length} (Expected: 100)`);
  console.log(`Total Companies Created:   ${createdCompanies.length} (Expected: 50)`);
  console.log(`Total Categories Created:  ${CATEGORY_DEFINITIONS.length} (Expected: 20)`);
  console.log(`Total Products Created:    ${totalProductsCount} (Expected: 200)`);
  console.log(`Warehouses in Primary:     ${createdWarehouses.length} (Expected: 10)`);
  console.log(`Customers in Primary:      ${primaryCustomers.length} (Expected: 30)`);
  console.log("--------------------------------------------------------------------");
  console.log("PRIMARY LOGIN CREDENTIALS:");
  console.log("  Role:       Company Admin");
  console.log("  Company:    DealFlow Apex Technologies");
  console.log(`  User Email: ${primaryAdmin.email}`);
  console.log(`  Password:   ${SEEDED_PASSWORD}`);
  console.log("--------------------------------------------------------------------");
  console.log("ADDITIONAL SAMPLE STAFF ACCOUNTS (Password: Password123!):");
  console.log("  Sales Manager:   sales.manager1@dealflow.com");
  console.log("  Sales Rep:       sales.rep1@dealflow.com");
  console.log("  Finance Manager: finance.manager1@dealflow.com");
  console.log("  Gold Customer:   customer1@clientcorp.com");
  console.log("====================================================================");
}

async function run() {
  try {
    await seedAll();
  } catch (error) {
    console.error("Seed failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

if (process.argv[1]?.endsWith("seed.ts")) {
  run();
}

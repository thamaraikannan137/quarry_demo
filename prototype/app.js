/* Arun Granites Quarry Manager — functional prototype (localStorage) */
(() => {
  const KEY = 'arun_quarry_proto_v16';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const uid = () => Math.random().toString(36).slice(2, 10);
  const today = () => new Date().toISOString().slice(0, 10);
  const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const cbm = (n) => Number(n || 0).toFixed(3);

  const DEFAULT_MACHINE_TYPES = [
    'Crane',
    'Poclain',
    'Compressor',
    'Genset',
    'Tipper',
    'Blade',
    'PRD',
    'Wiresaw',
    'Bore',
    'Other',
  ];

  const COMPANY = {
    name: 'Arun Granites',
    gstin: '33ALPPA8100P1ZO',
    ieCode: 'ALPPA8100P',
    state: 'Tamil Nadu',
    address: 'No.115/4, Plot No.A-6, Kumar Nagar, Melur — 625106, Madurai Dist, Tamil Nadu',
    phone: '',
    email: '',
    banks: 'CUB Melur · TMB Melur',
  };

  const DEFAULT_CBM_RATES = { I: 18000, II: 16000, III: 14000, Mix: 15000 };

  function defaultBanks() {
    return [
      {
        id: 'bk_cub',
        name: 'City Union Bank',
        branch: 'Melur',
        acNo: '510909010012345',
        ifsc: 'CIUB0000123',
        holder: 'Arun Granites',
        primary: true,
      },
      {
        id: 'bk_tmb',
        name: 'Tamilnad Mercantile Bank',
        branch: 'Melur',
        acNo: '123100050012345',
        ifsc: 'TMBL0000456',
        holder: 'Arun Granites',
        primary: false,
      },
    ];
  }

  function defaultQuarryRates(overrides = {}) {
    return {
      active: true,
      gstPct: 18,
      royaltyRate: 2500,
      slabRate: 92,
      cbmRates: { ...DEFAULT_CBM_RATES },
      ...overrides,
      cbmRates: { ...DEFAULT_CBM_RATES, ...(overrides.cbmRates || {}) },
    };
  }

  const PI_UNITS = ['NONE', 'CBM', 'SQF', 'NOS', 'TON'];
  const PI_TAX = ['0', '5', '12', '18', '28'];
  const INDIA_STATES = [
    'Tamil Nadu',
    'Andhra Pradesh',
    'Karnataka',
    'Kerala',
    'Telangana',
    'Puducherry',
    'Maharashtra',
    'Gujarat',
    'Rajasthan',
    'Madhya Pradesh',
    'Uttar Pradesh',
    'Delhi',
    'West Bengal',
    'Odisha',
    'Bihar',
    'Jharkhand',
    'Chhattisgarh',
    'Punjab',
    'Haryana',
    'Goa',
    'Other',
  ];

  /** Indian FY Apr–Mar → "2025-26" */
  const SESSION_KEY = 'arun_quarry_session_v1';

  function defaultUsers(q1, q2) {
    return [
      {
        id: 'u_owner',
        name: 'B. Arun',
        username: 'owner',
        password: 'owner123',
        role: 'Owner',
        quarryIds: ['*'],
        lastQuarryId: q1,
        active: true,
      },
      {
        id: 'u_acc',
        name: 'Thalapathi',
        username: 'accounts',
        password: 'acc123',
        role: 'Accountant',
        quarryIds: [q1, q2],
        lastQuarryId: q1,
        active: true,
      },
      {
        id: 'u_chitha',
        name: 'Chithanavasal office',
        username: 'chitha',
        password: 'chitha123',
        role: 'Accountant',
        quarryIds: [q1],
        lastQuarryId: q1,
        active: true,
      },
      {
        id: 'u_view',
        name: 'Office Viewer',
        username: 'view',
        password: 'view123',
        role: 'Viewer',
        quarryIds: [q1],
        lastQuarryId: q1,
        active: true,
      },
    ];
  }

  function ensureMastersDefaults(s) {
    if (!s.company) s.company = { ...COMPANY };
    else s.company = { ...COMPANY, ...s.company };
    if (!Array.isArray(s.banks) || !s.banks.length) s.banks = defaultBanks();
    (s.quarries || []).forEach((q) => {
      if (q.active == null) q.active = true;
      if (q.gstPct == null) q.gstPct = Number(s.gstRate) || 18;
      if (q.royaltyRate == null) q.royaltyRate = Number(s.royaltyRate) || 2500;
      if (q.slabRate == null) q.slabRate = 92;
      q.cbmRates = { ...DEFAULT_CBM_RATES, ...(q.cbmRates || {}) };
    });
    return s;
  }

  function fyFromDate(dateStr) {
    if (!dateStr) return null;
    const [y, m] = dateStr.split('-').map(Number);
    const start = m >= 4 ? y : y - 1;
    return `${start}-${String(start + 1).slice(-2)}`;
  }
  function currentFy() {
    return fyFromDate(today());
  }

  function seed() {
    const q1 = {
      id: 'q_chitha',
      name: 'Chithanavasal',
      code: 'CHITHA',
      place: 'Illuppur / Pudukkottai',
      ...defaultQuarryRates(),
    };
    const q2 = {
      id: 'q_ariyur',
      name: 'Ariyur',
      code: 'ARIYUR',
      place: 'Madurai Dist',
      ...defaultQuarryRates({ slabRate: 90, cbmRates: { I: 17000, II: 15000, III: 13000, Mix: 14500 } }),
    };
    const s = {
      activeQuarryId: q1.id,
      activeYear: '2026-27',
      years: ['2024-25', '2025-26', '2026-27'],
      quarries: [q1, q2],
      banks: defaultBanks(),
      users: defaultUsers(q1.id, q2.id),
      parties: [
        { id: 'p1', name: 'Platinam Stone', type: 'Customer', gstin: '33AAAAA0000A1Z5' },
        { id: 'p2', name: 'Thirupathi Granites', type: 'Customer', gstin: '—' },
        { id: 'p3', name: 'Jeevanram Granites', type: 'Customer', gstin: '—' },
        { id: 'p4', name: 'PVR Bulk', type: 'Vendor', gstin: '—' },
        { id: 'p5', name: 'Bhuvana Explosive', type: 'Vendor', gstin: '—' },
        { id: 'p6', name: 'Narayanasamy Royalty', type: 'Vendor', gstin: '—' },
        { id: 'pv_jee', name: 'Jeevanram Machinery', type: 'Vendor', gstin: '—' },
        { id: 'pv_boo', name: 'Boomi Machinery', type: 'Vendor', gstin: '—' },
        { id: 'pv_ele', name: 'Elephant Granites', type: 'Vendor', gstin: '—' },
      ],
      machineTypes: [...DEFAULT_MACHINE_TYPES],
      heads: [
        'Diesel',
        'Grocery / Food',
        'Labour Advance',
        'Labour Wage',
        'Salary Advance',
        'Salary',
        'Transport',
        'Repair',
        'Vendor Bill',
        'Vendor Payment',
        'Finance / EMI',
        'Monthly Gift',
        'Pooja',
        'Medical',
        'Cash Received',
        'Other',
      ],
      salaryPayments: [],
      staff: [
        // Chithanavasal — Staff active through Jul 2026; Aug 2026 keeps only 5 Workers
        { id: 's1', name: 'P. Ragul', designation: 'Incharge', category: 'Staff', basic: 15000, dailyRate: 0, quarryId: q1.id, joinDate: '2024-07-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: 'CUB Melur', bankAc: '1234567890', ifsc: 'CIUB0000123' },
        { id: 's2', name: 'Selvakumar', designation: 'Pit Incharge / SUP', category: 'Staff', basic: 40000, dailyRate: 0, quarryId: q1.id, joinDate: '2025-11-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: 'TMB Melur', bankAc: '9876543210', ifsc: 'TMBL0000456' },
        { id: 's3', name: 'Arun', designation: 'POC .OP', category: 'Staff', basic: 32000, dailyRate: 0, quarryId: q1.id, joinDate: '2026-01-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: 'CUB Melur', bankAc: '1122334455', ifsc: 'CIUB0000123' },
        { id: 's4', name: 'Arun', designation: 'Com/Op', category: 'Staff', basic: 17000, dailyRate: 0, quarryId: q1.id, joinDate: '2025-04-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: '', bankAc: '', ifsc: '' },
        { id: 's5', name: 'Chitra', designation: 'Mess / Cook', category: 'Staff', basic: 12000, dailyRate: 0, quarryId: q1.id, joinDate: '2024-12-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: 'CUB Melur', bankAc: '5566778899', ifsc: 'CIUB0000123' },
        { id: 's6', name: 'Marikannu', designation: 'Mess / Cook', category: 'Staff', basic: 10000, dailyRate: 0, quarryId: q1.id, joinDate: '2026-05-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: '', bankAc: '', ifsc: '' },
        { id: 's7', name: 'Bharathi', designation: 'PRD/op', category: 'Staff', basic: 30000, dailyRate: 0, quarryId: q1.id, joinDate: '2025-10-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: 'TMB Melur', bankAc: '6677889900', ifsc: 'TMBL0000456' },
        { id: 's8', name: 'Chandran', designation: 'Welder', category: 'Staff', basic: 25000, dailyRate: 0, quarryId: q1.id, joinDate: '2026-04-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: '', bankAc: '', ifsc: '' },
        { id: 's9', name: 'Thilak', designation: 'WS.OP', category: 'Staff', basic: 32000, dailyRate: 0, quarryId: q1.id, joinDate: '2025-01-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: 'CUB Melur', bankAc: '3344556677', ifsc: 'CIUB0000123' },
        { id: 's11', name: 'Suresh', designation: 'Crane Op', category: 'Staff', basic: 35000, dailyRate: 0, quarryId: q1.id, joinDate: '2025-12-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: 'CUB Melur', bankAc: '7788990011', ifsc: 'CIUB0000123' },
        { id: 's12', name: 'Thalapathi', designation: 'Office', category: 'Staff', basic: 25000, dailyRate: 0, quarryId: q1.id, joinDate: '2026-03-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', bankName: 'TMB Melur', bankAc: '8899001122', ifsc: 'TMBL0000456' },
        // Left earlier (Excel churn)
        { id: 's13', name: 'Soundar', designation: 'Pit Incharge', category: 'Staff', basic: 55000, dailyRate: 0, quarryId: q1.id, joinDate: '2024-07-01', exitDate: '2024-11-30', exitReason: 'Left quarry' },
        { id: 's14', name: 'Ashok', designation: 'Pit Incharge', category: 'Staff', basic: 37000, dailyRate: 0, quarryId: q1.id, joinDate: '2026-06-01', exitDate: '2026-07-31', exitReason: 'Demo trim for Aug workers', employment: [
          { kind: 'Join', date: '2024-09-01', note: 'Joined' },
          { kind: 'Exit', date: '2026-02-28', note: 'Stopped suddenly' },
          { kind: 'Rejoin', date: '2026-06-01', note: 'Rejoined quarry' },
          { kind: 'Exit', date: '2026-07-31', note: 'Left again' },
        ] },
        { id: 's15', name: 'Munaf', designation: 'Pit Incharge', category: 'Staff', basic: 40000, dailyRate: 0, quarryId: q1.id, joinDate: '2024-12-01', exitDate: '2026-03-15', exitReason: 'Left' },
        { id: 's16', name: 'Joseph', designation: 'Poclian o/p', category: 'Staff', basic: 32000, dailyRate: 0, quarryId: q1.id, joinDate: '2024-07-01', exitDate: '2024-11-15', exitReason: 'Left' },
        // Aug 2026 — only these 5 Workers
        { id: 's10', name: 'Kadar', designation: 'WS.Helper', category: 'Worker', basic: 0, dailyRate: 750, quarryId: q1.id, joinDate: '2026-05-01', exitDate: null, exitReason: '', bankName: '', bankAc: '', ifsc: '' },
        { id: 's17', name: 'Blade Op 1', designation: 'Blade/op', category: 'Worker', basic: 0, dailyRate: 1000, quarryId: q1.id, joinDate: '2026-07-01', exitDate: null, exitReason: '', bankName: '', bankAc: '', ifsc: '' },
        { id: 's18', name: 'Blade Op 2', designation: 'Blade/op', category: 'Worker', basic: 0, dailyRate: 1000, quarryId: q1.id, joinDate: '2026-07-01', exitDate: null, exitReason: '', bankName: '', bankAc: '', ifsc: '' },
        { id: 's22', name: 'Manimaran', designation: 'Poc/Help', category: 'Worker', basic: 0, dailyRate: 700, quarryId: q1.id, joinDate: '2026-06-01', exitDate: null, exitReason: '', bankName: '', bankAc: '', ifsc: '' },
        { id: 's23', name: 'Rajesh', designation: 'Helper', category: 'Worker', basic: 0, dailyRate: 650, quarryId: q1.id, joinDate: '2026-06-01', exitDate: null, exitReason: '', bankName: '', bankAc: '', ifsc: '' },
        // Ariyur
        { id: 's19', name: 'Mani', designation: 'Incharge', category: 'Staff', basic: 27000, dailyRate: 0, quarryId: q2.id, joinDate: '2024-06-01', exitDate: null, exitReason: '' },
        { id: 's20', name: 'Soundar', designation: 'Pit Incharge', category: 'Staff', basic: 55000, dailyRate: 0, quarryId: q2.id, joinDate: '2023-11-01', exitDate: '2025-06-30', exitReason: 'Transferred / left' },
        { id: 's21', name: 'Helper Ravi', designation: 'Poc/Help', category: 'Worker', basic: 0, dailyRate: 500, quarryId: q2.id, joinDate: '2026-01-10', exitDate: null, exitReason: '' },
      ],
      labour: [
        { id: 'l1', quarryId: q1.id, fy: '2026-27', name: 'Orissa Labour', days: 187.5, dayRate: 550, otNight: 16, otNightRate: 550, otHours: 7, otHourRate: 68.75, mastiri: 0, openingAdvance: 75000 },
        { id: 'l2', quarryId: q1.id, fy: '2026-27', name: 'Pullu Labour', days: 362, dayRate: 550, otNight: 9, otNightRate: 550, otHours: 56, otHourRate: 68.75, mastiri: 0, openingAdvance: 0 },
        { id: 'l5', quarryId: q1.id, fy: '2026-27', name: 'Pancha Labour', days: 240, dayRate: 550, otNight: 4, otNightRate: 550, otHours: 12, otHourRate: 68.75, mastiri: 0, openingAdvance: 0 },
        { id: 'l6', quarryId: q1.id, fy: '2025-26', name: 'Pullu Labour', days: 300, dayRate: 520, otNight: 6, otNightRate: 520, otHours: 40, otHourRate: 65, mastiri: 0, openingAdvance: 0 },
        { id: 'l7', quarryId: q1.id, fy: '2025-26', name: 'Pancha Labour', days: 180, dayRate: 520, otNight: 2, otNightRate: 520, otHours: 8, otHourRate: 65, mastiri: 0, openingAdvance: 0 },
        { id: 'l3', quarryId: q1.id, fy: '2025-26', name: 'Orissa Labour', days: 210, dayRate: 520, otNight: 10, otNightRate: 520, otHours: 20, otHourRate: 65, mastiri: 0, openingAdvance: 80000 },
        { id: 'l4', quarryId: q2.id, fy: '2024-25', name: 'Orissa Labour (Ariyur)', days: 113, dayRate: 500, otNight: 0, otNightRate: 500, otHours: 4, otHourRate: 62.5, mastiri: 0, openingAdvance: 25000 },
      ],
      expenses: [
        { id: uid(), quarryId: q1.id, date: '2025-12-01', type: 'Debit', head: 'Grocery / Food', particulars: "LPG Cylinder -2 No", debit: 3494, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2025-12-01', type: 'Debit', head: 'Repair', particulars: "Spray  Paint -2", debit: 260, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2025-12-01', type: 'Debit', head: 'Transport', particulars: "Petrol -( Malar)", debit: 100, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2025-12-01', type: 'Debit', head: 'Other', particulars: "Mate-2, Plate-2, Pillar", debit: 1300, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2025-12-02', type: 'Debit', head: 'Diesel', particulars: "1000 Lit Diesal Purchae ( Ismail Bulk)", debit: 93270, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2025-12-02', type: 'Credit', head: 'Cash Received', particulars: "Pdk Mani Cash to manimaran", debit: 0, credit: 190000, partyId: 'p1' },
        { id: uid(), quarryId: q1.id, date: '2025-12-02', type: 'Debit', head: 'Salary Advance', particulars: "Manimaran Salary Adv", debit: 2000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2025-12-05', type: 'Debit', head: 'Diesel', particulars: "750 Lit Diesal Purchase ( Ismail Bulk)", debit: 70000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2025-12-07', type: 'Debit', head: 'Labour Advance', particulars: "Pullu Labour Salary Adv", debit: 15000, credit: 0, labourId: 'l6' },
        { id: uid(), quarryId: q1.id, date: '2025-12-12', type: 'Debit', head: 'Pooja', particulars: "Poojai,Kannmai Karaiyil Kovil Poojai Things", debit: 1100, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-01-01', type: 'Credit', head: 'Cash Received', particulars: "Arun Deposite To Ragul A/C", debit: 0, credit: 10000, partyId: 'p2' },
        { id: uid(), quarryId: q1.id, date: '2026-01-01', type: 'Debit', head: 'Grocery / Food', particulars: "Food Exp", debit: 200, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-01-01', type: 'Debit', head: 'Repair', particulars: "Engin Oil-5ltr For Grane -II  ,Battery Leg-4 Nos", debit: 1700, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-01-01', type: 'Debit', head: 'Transport', particulars: "Mss Parcel Charge Wiresaw Spares", debit: 900, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-01-01', type: 'Debit', head: 'Other', particulars: "Excess  Expences", debit: 195, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-01-02', type: 'Debit', head: 'Diesel', particulars: "1000 Lit Diesal Purchase ( Periyanayagi Bulk)", debit: 93270, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-01-02', type: 'Credit', head: 'Cash Received', particulars: "Arun G Pay To Ragul", debit: 0, credit: 5000, partyId: 'p3' },
        { id: uid(), quarryId: q1.id, date: '2026-01-04', type: 'Debit', head: 'Labour Advance', particulars: "Pancha Labour A/c Adv (Gpay)", debit: 10000, credit: 0, labourId: 'l7' },
        { id: uid(), quarryId: q1.id, date: '2026-01-04', type: 'Debit', head: 'Salary Advance', particulars: "Arun Poc Op Salary Adv", debit: 2000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-01-04', type: 'Debit', head: 'Diesel', particulars: "1000 Lit Diesal Purchase ( Periyanayagi Bulk)", debit: 93270, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-02-01', type: 'Credit', head: 'Cash Received', particulars: "Arun To Malar  A/c", debit: 0, credit: 70000, partyId: 'p4' },
        { id: uid(), quarryId: q1.id, date: '2026-02-01', type: 'Debit', head: 'Labour Advance', particulars: "Pancha Labour A/c  Adv", debit: 15000, credit: 0, labourId: 'l7' },
        { id: uid(), quarryId: q1.id, date: '2026-02-01', type: 'Debit', head: 'Salary Advance', particulars: "Ragul Salary Adv", debit: 500, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-02-01', type: 'Debit', head: 'Grocery / Food', particulars: "Dringing Water Purchase", debit: 900, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-02-01', type: 'Debit', head: 'Repair', particulars: "Malar ATM Exp", debit: 120, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-02-01', type: 'Debit', head: 'Transport', particulars: "Petrol Exp", debit: 150, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-02-02', type: 'Debit', head: 'Diesel', particulars: "1000 lit Diesal Purchase (Ismail Bulk)", debit: 93270, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-02-02', type: 'Credit', head: 'Cash Received', particulars: "Bulk", debit: 0, credit: 93270, partyId: 'p1' },
        { id: uid(), quarryId: q1.id, date: '2026-02-03', type: 'Debit', head: 'Other', particulars: "Machanic Cooli", debit: 500, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-02-04', type: 'Debit', head: 'Diesel', particulars: "Auto Frieght Paid ( For Diesal)", debit: 600, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-01', type: 'Debit', head: 'Repair', particulars: "Fire Wood Purchase", debit: 5250, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-01', type: 'Debit', head: 'Transport', particulars: "Ashok Petrol Exp", debit: 250, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-02', type: 'Debit', head: 'Diesel', particulars: "997 Ltrs Diesel Purchase ( Ismail Bulk)", debit: 93000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-02', type: 'Credit', head: 'Cash Received', particulars: "Bulk", debit: 0, credit: 93000, partyId: 'p2' },
        { id: uid(), quarryId: q1.id, date: '2026-04-03', type: 'Debit', head: 'Grocery / Food', particulars: "Tea exp ragul", debit: 100, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-04', type: 'Credit', head: 'Cash Received', particulars: "Arun Paid G-Pay to Ragul", debit: 0, credit: 10000, partyId: 'p3' },
        { id: uid(), quarryId: q1.id, date: '2026-04-04', type: 'Debit', head: 'Grocery / Food', particulars: "Food Expensess", debit: 200, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-04', type: 'Debit', head: 'Repair', particulars: "Mangudi Tata Crane Dyname Repair work", debit: 4200, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-05', type: 'Debit', head: 'Labour Advance', particulars: "Arun  labour A/c Adv", debit: 10000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-05', type: 'Debit', head: 'Salary Advance', particulars: "Ellumalai Salary Adv", debit: 1000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-05', type: 'Debit', head: 'Other', particulars: "Mangudi Quarry A/c", debit: 5000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-05', type: 'Debit', head: 'Diesel', particulars: "100 Ltrs Diesel Purchase ( Ismail Bulk)", debit: 93270, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-04-05', type: 'Debit', head: 'Labour Advance', particulars: "Pancha Labour A/c Adv", debit: 10000, credit: 0, labourId: 'l5' },
        { id: uid(), quarryId: q1.id, date: '2026-04-05', type: 'Debit', head: 'Salary Advance', particulars: "Munaf Salary Adv", debit: 1000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-01', type: 'Debit', head: 'Diesel', particulars: "600 lit Diesal Purchase ( Ismail Bulk)", debit: 55962, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-01', type: 'Credit', head: 'Cash Received', particulars: "Bulk", debit: 0, credit: 55962, partyId: 'p4' },
        { id: uid(), quarryId: q1.id, date: '2026-05-01', type: 'Debit', head: 'Grocery / Food', particulars: "Tea Exp", debit: 50, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-01', type: 'Debit', head: 'Transport', particulars: "Mss Parcel charge", debit: 170, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-02', type: 'Debit', head: 'Diesel', particulars: "400 lit Diesal Purchase ( Ismail Bulk)", debit: 37308, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-02', type: 'Credit', head: 'Cash Received', particulars: "Bulk", debit: 0, credit: 37308, partyId: 'p1' },
        { id: uid(), quarryId: q1.id, date: '2026-05-02', type: 'Debit', head: 'Grocery / Food', particulars: "Vegitable Curd", debit: 140, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-03', type: 'Debit', head: 'Labour Advance', particulars: "Pancha Labour A/c Adv", debit: 6000, credit: 0, labourId: 'l5' },
        { id: uid(), quarryId: q1.id, date: '2026-05-03', type: 'Debit', head: 'Labour Advance', particulars: "Pullu Labour A/c Adv", debit: 6000, credit: 0, labourId: 'l2' },
        { id: uid(), quarryId: q1.id, date: '2026-05-06', type: 'Debit', head: 'Other', particulars: "Police Exp", debit: 200, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-07', type: 'Debit', head: 'Repair', particulars: "Hittachi Teeth Purchase ( Raambaag)", debit: 20790, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-10', type: 'Debit', head: 'Salary Advance', particulars: "Arun Salary Adv", debit: 1000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-10', type: 'Debit', head: 'Salary Advance', particulars: "Thilak Salary Adv", debit: 1500, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-05-27', type: 'Debit', head: 'Medical', particulars: "Medical Exp", debit: 200, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-06-01', type: 'Debit', head: 'Diesel', particulars: "600 Lit diesal Purchase (PVR Bulk)", debit: 60264, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-06-01', type: 'Debit', head: 'Repair', particulars: "Hyd Oil 26 Lit,Adapter, Emar Sheet", debit: 6140, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-06-05', type: 'Debit', head: 'Diesel', particulars: "600 Lit diesal Purchase (PVR Bulk)", debit: 50291, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-06-14', type: 'Credit', head: 'Cash Received', particulars: "Bulk", debit: 0, credit: 55962, partyId: 'p2' },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Debit', head: 'Labour Advance', particulars: "Pullu Labour A/c Adv", debit: 15000, credit: 0, labourId: 'l2' },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Debit', head: 'Salary Advance', particulars: "Arun Poc Salary Adv", debit: 2000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Debit', head: 'Grocery / Food', particulars: "Vegitable Chicken Purchase ( Last Week)", debit: 3000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Debit', head: 'Repair', particulars: "Tap, Spary Paint", debit: 540, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Debit', head: 'Transport', particulars: "Wiresae rope Parcel", debit: 300, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Debit', head: 'Other', particulars: "Battary Post 3 Nos", debit: 1900, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Credit', head: 'Cash Received', particulars: "Quarry Weekly Adv", debit: 0, credit: 60000, partyId: 'p3' },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Debit', head: 'Labour Advance', particulars: "Pancha Labour A/c Adv", debit: 15000, credit: 0, labourId: 'l5' },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Debit', head: 'Salary Advance', particulars: "Kadar Salary Adv", debit: 1000, credit: 0, personId: 's10' },
        { id: uid(), quarryId: q1.id, date: '2026-06-24', type: 'Debit', head: 'Grocery / Food', particulars: "Vegitable Purchase", debit: 3800, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-04', type: 'Debit', head: 'Diesel', particulars: "600 Lit Diesal Purchase ( Pvr Bulk)", debit: 60624, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-04', type: 'Credit', head: 'Cash Received', particulars: "Bulk", debit: 0, credit: 60264, partyId: 'p4' },
        { id: uid(), quarryId: q1.id, date: '2026-07-05', type: 'Debit', head: 'Labour Advance', particulars: "Pullu Labour A/c Adv", debit: 18000, credit: 0, labourId: 'l2' },
        { id: uid(), quarryId: q1.id, date: '2026-07-05', type: 'Debit', head: 'Salary Advance', particulars: "Selvakumar Salary Adv", debit: 1000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-05', type: 'Debit', head: 'Grocery / Food', particulars: "Vegitable Purchase", debit: 3500, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-05', type: 'Debit', head: 'Transport', particulars: "Auto Frieght", debit: 250, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-05', type: 'Credit', head: 'Cash Received', particulars: "Arun Gpay To Ragul", debit: 0, credit: 45000, partyId: 'p1' },
        { id: uid(), quarryId: q1.id, date: '2026-07-05', type: 'Debit', head: 'Salary Advance', particulars: "Bharathi Salary Adv", debit: 1000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-06', type: 'Debit', head: 'Repair', particulars: "Altas Cop Murugan ( comprassor ServiceWork)", debit: 85000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-06', type: 'Debit', head: 'Other', particulars: "Bhuvana Explosive icici A/c", debit: 70000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-06', type: 'Debit', head: 'Grocery / Food', particulars: "Milk Payment Paid", debit: 2280, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-08', type: 'Debit', head: 'Diesel', particulars: "500 Lit Diesal Purchase ( Ismail Bulk)", debit: 50000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-07-11', type: 'Debit', head: 'Labour Advance', particulars: "Pullu Labour A/c June-26 Payment Adv", debit: 130000, credit: 0, labourId: 'l2' },
        { id: uid(), quarryId: q1.id, date: '2026-07-29', type: 'Debit', head: 'Pooja', particulars: "Blade Pooja exp", debit: 1000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-01', type: 'Debit', head: 'Diesel', particulars: "500 Lit Diesal Purchase ( Periyanyagi Bulk)", debit: 50220, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-01', type: 'Credit', head: 'Cash Received', particulars: "Arun To Thalapathi", debit: 0, credit: 53572, partyId: 'p2' },
        { id: uid(), quarryId: q1.id, date: '2026-08-01', type: 'Debit', head: 'Repair', particulars: "PRD Bore Bit 2 Nos Purchase ( Prd Rigs)", debit: 53572, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-01', type: 'Credit', head: 'Cash Received', particulars: "Bulk", debit: 0, credit: 50220, partyId: 'p3' },
        { id: uid(), quarryId: q1.id, date: '2026-08-10', type: 'Credit', head: 'Cash Received', particulars: 'Partial receipt — PS-101', debit: 0, credit: 80000, partyId: 'p1', markingId: 'mk1' },
        { id: uid(), quarryId: q1.id, date: '2026-08-18', type: 'Credit', head: 'Cash Received', particulars: '2nd payment — PS-101', debit: 0, credit: 50000, partyId: 'p1', markingId: 'mk1' },
        { id: uid(), quarryId: q1.id, date: '2025-12-01', type: 'Credit', head: 'Cash Received', particulars: 'Full receipt — PS-44', debit: 0, credit: 101790, partyId: 'p1', markingId: 'mk4' },
        { id: uid(), quarryId: q1.id, date: '2026-08-02', type: 'Debit', head: 'Labour Advance', particulars: "Pulllu Labour A/c Adv", debit: 18000, credit: 0, labourId: 'l2' },
        { id: uid(), quarryId: q1.id, date: '2026-08-02', type: 'Debit', head: 'Salary Advance', particulars: "Arun Poc Salary Adv", debit: 3000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-02', type: 'Debit', head: 'Grocery / Food', particulars: "LPG Cyclinder Purchase", debit: 1920, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-02', type: 'Debit', head: 'Transport', particulars: "Auto Frieght", debit: 250, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-02', type: 'Debit', head: 'Diesel', particulars: "Pick Up Rent Diesal", debit: 1200, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-02', type: 'Debit', head: 'Salary Advance', particulars: "Rajesh Salary Adv", debit: 1000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-02', type: 'Debit', head: 'Grocery / Food', particulars: "Vegitable Purchase", debit: 3800, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-02', type: 'Debit', head: 'Transport', particulars: "Petrol exp", debit: 200, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-05', type: 'Debit', head: 'Repair', particulars: "Coolant Oil Purchase", debit: 1000, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-06', type: 'Debit', head: 'Other', particulars: "Meals Plate 3 Nos Purchase", debit: 200, credit: 0 },
        { id: uid(), quarryId: q1.id, date: '2026-08-02', type: 'Debit', head: 'Vendor Payment', particulars: 'Cash paid — Bhuvana Explosive', debit: 25000, credit: 0, partyId: 'p5' },
        { id: uid(), quarryId: q1.id, date: '2026-07-20', type: 'Debit', head: 'Vendor Payment', particulars: 'Cash paid — PVR Bulk', debit: 40000, credit: 0, partyId: 'p4' },

        { id: uid(), quarryId: q2.id, date: '2026-08-01', type: 'Credit', head: 'Cash Received', particulars: "Opening / capital cash", debit: 0, credit: 150000, partyId: 'p4' },
        { id: uid(), quarryId: q2.id, date: '2026-08-04', type: 'Debit', head: 'Transport', particulars: "Freight", debit: 12000, credit: 0 },
        { id: uid(), quarryId: q2.id, date: '2024-09-05', type: 'Debit', head: 'Transport', particulars: "Tailor freight & crane unload", debit: 31000, credit: 0 },
      ],
      partyLedger: [
        { id: uid(), quarryId: q1.id, partyId: 'p5', date: '2026-07-31', particulars: 'Explosive bill — July', debit: 0, credit: 85000, kind: 'Bill' },
        { id: uid(), quarryId: q1.id, partyId: 'p5', date: '2026-08-15', particulars: 'Explosive bill — August', debit: 0, credit: 62000, kind: 'Bill' },
        { id: uid(), quarryId: q1.id, partyId: 'p4', date: '2026-07-15', particulars: 'Bulk diesel / material bill', debit: 0, credit: 120000, kind: 'Bill' },
        { id: uid(), quarryId: q1.id, partyId: 'p6', date: '2026-08-01', particulars: 'Royalty opening / bill', debit: 0, credit: 175000, kind: 'Bill' },
        { id: uid(), quarryId: q1.id, partyId: 'p6', date: '2026-08-10', particulars: 'Royalty cash paid', debit: 100000, credit: 0, kind: 'Payment' },
      ],
      markings: [
        { id: 'mk1', quarryId: q1.id, date: '2026-08-04', partyId: 'p1', blockNo: 'PS-101', choice: 'I', l: 320, w: 170, h: 140, rate: 18000, load: 'OK' },
        { id: 'mk2', quarryId: q1.id, date: '2026-08-04', partyId: 'p1', blockNo: 'PS-102', choice: 'II', l: 300, w: 150, h: 120, rate: 18000, load: 'OK' },
        { id: 'mk3', quarryId: q1.id, date: '2026-08-08', partyId: 'p2', blockNo: 'TER-501', choice: 'I', l: 310, w: 160, h: 130, rate: 21000, load: 'Pending' },
        { id: 'mk4', quarryId: q1.id, date: '2025-11-18', partyId: 'p1', blockNo: 'PS-44', choice: 'I', l: 290, w: 150, h: 110, rate: 18000, load: 'OK' },
        { id: 'mk5', quarryId: q1.id, date: '2025-03-22', partyId: 'p2', blockNo: 'TER-420', choice: 'II', l: 300, w: 120, h: 80, rate: 21000, load: 'OK' },
        { id: 'mk6', quarryId: q2.id, date: '2024-10-01', partyId: 'p3', blockNo: 'AR-01', choice: 'I', l: 280, w: 140, h: 110, rate: 17000, load: 'OK' },
        { id: 'mk7', quarryId: q2.id, date: '2026-07-20', partyId: 'p3', blockNo: 'AR-09', choice: 'III', l: 300, w: 160, h: 120, rate: 17500, load: 'OK' },
      ],
      attendance: {},
      labourAttendance: {},
      machines: [
        { id: 'm1', quarryId: q1.id, name: 'HM Crane', type: 'Crane', vendorId: 'pv_jee', monthlyRent: 160000, active: true },
        { id: 'm2', quarryId: q1.id, name: 'Hitachi Poclain', type: 'Poclain', vendorId: 'pv_jee', monthlyRent: 260000, active: true },
        { id: 'm3', quarryId: q1.id, name: 'HM 101 Crane', type: 'Crane', vendorId: 'pv_jee', monthlyRent: 160000, active: true },
        { id: 'm4', quarryId: q1.id, name: 'Com 176', type: 'Compressor', vendorId: 'pv_boo', monthlyRent: 35000, active: true },
        { id: 'm5', quarryId: q1.id, name: 'Com 187', type: 'Compressor', vendorId: 'pv_boo', monthlyRent: 40000, active: true },
        { id: 'm6', quarryId: q1.id, name: 'Genset', type: 'Genset', vendorId: 'pv_boo', monthlyRent: 75000, active: true },
        { id: 'm7', quarryId: q1.id, name: 'Wiresaw / Bore', type: 'Wiresaw', vendorId: 'pv_boo', monthlyRent: 0, active: true },
        { id: 'm8', quarryId: q1.id, name: 'Tipper', type: 'Tipper', vendorId: 'pv_boo', monthlyRent: 100000, active: true },
        { id: 'm9', quarryId: q1.id, name: 'Cutting Blade', type: 'Blade', vendorId: 'pv_ele', monthlyRent: 250000, active: true },
        { id: 'm10', quarryId: q2.id, name: 'Ariyur Tipper', type: 'Tipper', vendorId: 'pv_boo', monthlyRent: 0, active: true },
      ],
      machineReadings: [
        { id: uid(), quarryId: q1.id, machineId: 'm1', vendorId: 'pv_jee', date: '2026-08-31', month: '2026-08', startReading: 'Full', closeReading: 'Full', hours: null, days: 31, diesel: 40, litPerHour: 0, rent: 160000 },
        { id: uid(), quarryId: q1.id, machineId: 'm2', vendorId: 'pv_jee', date: '2026-08-31', month: '2026-08', startReading: 3130.4, closeReading: 3264.2, hours: 133.8, days: 31, diesel: 1802, litPerHour: 13.47, rent: 260000 },
        { id: uid(), quarryId: q1.id, machineId: 'm5', vendorId: 'pv_boo', date: '2026-08-31', month: '2026-08', startReading: 'Full', closeReading: 'Full', hours: null, days: 31, diesel: 900, litPerHour: 0, rent: 40000 },
        { id: uid(), quarryId: q1.id, machineId: 'm6', vendorId: 'pv_boo', date: '2026-08-20', month: '2026-08', startReading: 'Full', closeReading: 'Full', hours: null, days: 20, diesel: 680, litPerHour: 0, rent: 48400 },
        { id: uid(), quarryId: q1.id, machineId: 'm1', vendorId: 'pv_jee', date: '2026-07-31', month: '2026-07', startReading: 'Full', closeReading: 'Full', hours: null, days: 31, diesel: 40, litPerHour: 0, rent: 160000 },
        { id: uid(), quarryId: q1.id, machineId: 'm2', vendorId: 'pv_jee', date: '2026-07-31', month: '2026-07', startReading: 3000, closeReading: 3130.4, hours: 130.4, days: 31, diesel: 1700, litPerHour: 13.04, rent: 260000 },
        { id: uid(), quarryId: q2.id, machineId: 'm10', vendorId: 'pv_boo', date: '2024-10-07', month: '2024-10', startReading: '', closeReading: '', hours: null, days: 7, diesel: 140, litPerHour: 0, rent: 0 },
      ],
      // Rent credits come from machineReadings via syncMachineLedgerFromReadings —
      // keep only payments / repairs / manual rents with no matching reading here.
      machineLedger: [
        { id: uid(), quarryId: q1.id, vendorId: 'pv_jee', date: '2026-08-10', particulars: 'Cash paid — Jeevanram rent', debit: 300000, credit: 0, kind: 'Payment', readingId: null },
        { id: uid(), quarryId: q1.id, vendorId: 'pv_jee', date: '2026-08-05', particulars: 'Poclain teeth repair', debit: 13000, credit: 0, kind: 'Repair', readingId: null },
        { id: uid(), quarryId: q1.id, vendorId: 'pv_boo', date: '2026-07-31', particulars: 'Com 187 July rent', debit: 0, credit: 40000, kind: 'Rent', readingId: null },
        { id: uid(), quarryId: q1.id, vendorId: 'pv_boo', date: '2026-08-11', particulars: 'Cash paid — Boomi rent', debit: 145000, credit: 0, kind: 'Payment', readingId: null },
        { id: uid(), quarryId: q1.id, vendorId: 'pv_ele', date: '2026-07-31', particulars: 'Blade machine July rent', debit: 0, credit: 250000, kind: 'Rent', readingId: null },
        { id: uid(), quarryId: q1.id, vendorId: 'pv_ele', date: '2026-08-12', particulars: 'Cash paid — Elephant', debit: 200000, credit: 0, kind: 'Payment', readingId: null },
      ],
      royaltyRate: 2500,
      gstRate: 18,
      company: { ...COMPANY },
      invoices: [
        {
          id: 'pi1',
          quarryId: q1.id,
          type: 'block',
          refNo: '1',
          date: '2026-08-04',
          partyId: 'p1',
          stateOfSupply: 'Tamil Nadu',
          priceWithTax: false,
          lines: [
            {
              id: 'pil1',
              item: 'PS-101 — Multi colour rough granite blocks 320×170×140',
              qty: 7.616,
              unit: 'CBM',
              price: 18000,
              discPct: 0,
              discAmt: 0,
              taxPct: 18,
              hsn: '2516',
              markingId: 'mk1',
            },
            {
              id: 'pil2',
              item: 'PS-102 — Multi colour rough granite blocks 300×150×120',
              qty: 5.4,
              unit: 'CBM',
              price: 18000,
              discPct: 0,
              discAmt: 0,
              taxPct: 18,
              hsn: '2516',
              markingId: 'mk2',
            },
          ],
          terms:
            '1. Payment as per agreement.\n2. Unloading at buyer’s scope.\n3. Subject to Melur jurisdiction.',
          description: 'MATERIAL NAME — RAWSILK IVORY\nMARKED BY — MOOL SINGH\nNUMBER OF BLOCKS — 2',
          imageData: '',
          documentName: '',
          documentData: '',
          roundOff: true,
          orderNo: '',
          orderDate: '',
          fob: '',
          paymentTerms: '',
          currency: 'INR',
          status: 'saved',
        },
      ],
      // From SRIRAM FINANCE DUE CHAT.xlsx — loans only (monthly gift excluded)
      loans: [
        { id: 'ln1', vehicleNo: 'Lorry-TN88H8977', borrower: 'Sibi', loanNo: 'MELRB-2601230002', informDay: 3, dueDay: 5, bank: 'FEDRAL', emiAmount: 91144, active: true },
        { id: 'ln2', vehicleNo: 'PRD-500', borrower: 'Arun', loanNo: 'MELRB-2412230004', informDay: 3, dueDay: 5, bank: 'CUB', emiAmount: 111868, active: true },
        { id: 'ln3', vehicleNo: 'Car- High cross', borrower: 'Arun', loanNo: 'MELRB-2303090005', informDay: 8, dueDay: 10, bank: 'AXIS', emiAmount: 57000, active: true },
        { id: 'ln4', vehicleNo: 'Lorry-TN28BK7378', borrower: 'Rishi', loanNo: 'MELRB-2602120001', informDay: 7, dueDay: 10, bank: 'TMB', emiAmount: 91332, active: true },
        { id: 'ln5', vehicleNo: 'Kobalco-380', borrower: 'Rishi', loanNo: 'MELRB-2601230005', informDay: 7, dueDay: 10, bank: 'TMB', emiAmount: 188193, active: true },
        { id: 'ln6', vehicleNo: 'Hittachi-370', borrower: 'Arun', loanNo: 'MELRB-2511210002', informDay: 7, dueDay: 10, bank: 'CUB', emiAmount: 154164, active: true },
        { id: 'ln7', vehicleNo: 'PRD-250', borrower: 'Arun', loanNo: 'MELRB-2511210003', informDay: 7, dueDay: 10, bank: 'CUB', emiAmount: 90536, active: true },
        { id: 'ln8', vehicleNo: 'Hittachi-370 New', borrower: 'Kumar Stone', loanNo: 'MELRB-2602270005', informDay: 13, dueDay: 15, bank: 'TMB', emiAmount: 267571, active: true },
        { id: 'ln9', vehicleNo: 'Lorry-TN88L2691', borrower: 'Sibi', loanNo: 'MELRB-2607150002', informDay: 13, dueDay: 15, bank: 'FEDRAL', emiAmount: 95500, active: true },
        { id: 'ln10', vehicleNo: 'Car', borrower: 'MKB- Appa', loanNo: 'Sbi', informDay: 13, dueDay: 15, bank: 'TMB', emiAmount: 56000, active: true },
        { id: 'ln11', vehicleNo: 'Business- Loan', borrower: 'Arun', loanNo: 'MELRBTF-2505300001', informDay: 18, dueDay: 20, bank: 'CUB', emiAmount: 512000, active: true },
        { id: 'ln12', vehicleNo: 'Car', borrower: 'Saravanapriya', loanNo: 'Bank Of India', informDay: 23, dueDay: 25, bank: 'HDFC', emiAmount: 66000, active: true },
        { id: 'ln13', vehicleNo: 'Housing Loan', borrower: 'Arun', loanNo: 'Lvb', informDay: 3, dueDay: 5, bank: 'LVB', emiAmount: 30000, active: true },
      ],
      loanPayments: [],
      // From SRIRAM FINANCE DUE CHAT.xlsx — EVERY MONTH GIFT (due day 7)
      gifts: [
        { id: 'gf1', place: 'ILLUPPOR', office: 'THASILTHAR', amount: 20000, dueDay: 7, active: true },
        { id: 'gf2', place: 'ANNAVASAL', office: 'RI & VAO (10+5)', amount: 15000, dueDay: 7, active: true },
        { id: 'gf3', place: 'ANNAVASAL', office: 'POLICE STATION', amount: 17000, dueDay: 7, active: true },
        { id: 'gf4', place: 'ILLUPPOR', office: 'ILLUPPOR', amount: 10000, dueDay: 7, active: true },
        { id: 'gf5', place: 'MELUR', office: 'MELUR (DSP)', amount: 10000, dueDay: 7, active: true },
        { id: 'gf6', place: 'MELUR', office: 'INSPECTER - MELUR (10+3)', amount: 13000, dueDay: 7, active: true },
        { id: 'gf7', place: 'MELUR', office: 'MELUR- THASILTHAR (10+3+2)', amount: 15000, dueDay: 7, active: true },
        { id: 'gf8', place: 'MELUR', office: 'KANNAN ( RI )', amount: 10000, dueDay: 7, active: true },
        { id: 'gf9', place: 'THIRUVATHOOR', office: 'RI', amount: 5000, dueDay: 7, active: true },
        { id: 'gf10', place: 'POOVANTHI', office: 'THASILTHAR -THIRUPPUVANAM (10+2)', amount: 12000, dueDay: 7, active: true },
        { id: 'gf11', place: 'MELUR', office: 'TRAFFIC POLICE', amount: 3000, dueDay: 7, active: true },
      ],
      giftPayments: [],
    };
    const fillGang = (labourId, avg) => {
      const key = q1.id + '|2026-08|' + labourId;
      const map = {};
      for (let d = 1; d <= 31; d++) {
        if (new Date(2026, 7, d).getDay() === 0) continue;
        const n = Math.max(0, avg + ((d % 5) - 2));
        if (!n) continue;
        map[String(d)] = {
          n,
          ot: d % 6 === 0 ? 4 : 0,
          night: d % 5 === 0 ? Math.max(1, Math.round(n * 0.4)) : 0,
        };
      }
      s.labourAttendance[key] = map;
    };
    fillGang('l1', 8);
    fillGang('l2', 14);
    fillGang('l5', 11);
    return s;
  }

  /** Readings are source of truth for rent Credit on vendor pending. */
  function syncMachineLedgerFromReadings(s) {
    const machines = s.machines || [];
    const readings = s.machineReadings || [];
    let ledger = [...(s.machineLedger || [])];
    const readingIds = new Set(readings.map((r) => r.id));

    // Drop rent rows tied to deleted readings
    ledger = ledger.filter((e) => !(e.kind === 'Rent' && e.readingId && !readingIds.has(e.readingId)));

    readings.forEach((r) => {
      const rent = Number(r.rent) || 0;
      if (!r.vendorId || rent <= 0) {
        ledger = ledger.filter((e) => e.readingId !== r.id);
        return;
      }

      const mac = machines.find((m) => m.id === r.machineId);
      const ym = r.month || (r.date ? String(r.date).slice(0, 7) : '');
      const date =
        r.date ||
        (ym ? `${ym}-${String(daysInMonth(ym)).padStart(2, '0')}` : today());

      // Drop duplicate manual / orphan Rent for same machine + month
      ledger = ledger.filter((e) => {
        if (e.kind !== 'Rent' || e.readingId) return true;
        if (e.quarryId !== r.quarryId || e.vendorId !== r.vendorId) return true;
        const eYm = (e.date || '').slice(0, 7);
        if (eYm !== ym) return true;
        if (e.machineId && e.machineId === r.machineId) return false;
        if (!e.machineId && Number(e.credit || 0) === rent) {
          const name = (mac?.name || '').toLowerCase();
          if (name && String(e.particulars || '').toLowerCase().includes(name)) return false;
        }
        return true;
      });

      const patch = {
        quarryId: r.quarryId,
        vendorId: r.vendorId,
        machineId: r.machineId || '',
        date,
        particulars: `${mac?.name || 'Machine'} · ${monthLabel(ym)} rent`,
        debit: 0,
        credit: rent,
        kind: 'Rent',
        readingId: r.id,
      };
      const existing = ledger.find((e) => e.readingId === r.id);
      if (existing) Object.assign(existing, patch);
      else ledger.push({ id: uid(), ...patch });
    });

    s.machineLedger = ledger;
    return s;
  }

  /** Vendor pending Debits (cash paid) must also appear in All Transactions. */
  function syncMachVendorDebitsToCash(s) {
    if (!s.expenses) s.expenses = [];
    if (!s.machineLedger) s.machineLedger = [];
    s.machineLedger.forEach((e) => {
      const debit = Number(e.debit) || 0;
      if (debit <= 0) return;
      if (e.expenseId && s.expenses.some((x) => x.id === e.expenseId)) return;
      const linked = s.expenses.find((x) => x.machineLedgerId === e.id);
      if (linked) {
        e.expenseId = linked.id;
        return;
      }
      const expenseId = uid();
      e.expenseId = expenseId;
      const head = e.kind === 'Repair' ? 'Repair' : e.kind === 'Other' ? 'Other' : 'Vendor Payment';
      s.expenses.push({
        id: expenseId,
        quarryId: e.quarryId,
        date: e.date,
        type: 'Debit',
        head,
        particulars: e.particulars,
        debit,
        credit: 0,
        partyId: e.vendorId || '',
        machineLedgerId: e.id,
      });
    });
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const s = syncMachVendorDebitsToCash(syncMachineLedgerFromReadings(seed()));
        save(s);
        return s;
      }
      const s = JSON.parse(raw);
      if (!s.activeYear) s.activeYear = currentFy();
      if (!s.years || !s.years.length) s.years = ['2024-25', '2025-26', '2026-27'];
      if (!s.salaryPayments) s.salaryPayments = [];
      if (!s.labourAttendance) s.labourAttendance = {};
      if (s.gstRate == null) s.gstRate = 18;
      if (!s.machineTypes) s.machineTypes = [...DEFAULT_MACHINE_TYPES];
      if (!s.machineReadings) s.machineReadings = [];
      if (!s.machineLedger) s.machineLedger = [];
      if (!s.partyLedger) s.partyLedger = [];
      (s.parties || []).forEach((p) => {
        if (p.type === 'Buyer') p.type = 'Customer';
      });
      if (s.heads && !s.heads.includes('Vendor Bill')) s.heads.push('Vendor Bill');
      if (s.heads && !s.heads.includes('Vendor Payment')) s.heads.push('Vendor Payment');
      if (s.heads && !s.heads.includes('Finance / EMI')) s.heads.push('Finance / EMI');
      if (s.heads && !s.heads.includes('Monthly Gift')) s.heads.push('Monthly Gift');
      if (!s.loans || !s.loans.length) {
        s.loans = [
          { id: 'ln1', vehicleNo: 'Lorry-TN88H8977', borrower: 'Sibi', loanNo: 'MELRB-2601230002', informDay: 3, dueDay: 5, bank: 'FEDRAL', emiAmount: 91144, active: true },
          { id: 'ln2', vehicleNo: 'PRD-500', borrower: 'Arun', loanNo: 'MELRB-2412230004', informDay: 3, dueDay: 5, bank: 'CUB', emiAmount: 111868, active: true },
          { id: 'ln3', vehicleNo: 'Car- High cross', borrower: 'Arun', loanNo: 'MELRB-2303090005', informDay: 8, dueDay: 10, bank: 'AXIS', emiAmount: 57000, active: true },
          { id: 'ln4', vehicleNo: 'Lorry-TN28BK7378', borrower: 'Rishi', loanNo: 'MELRB-2602120001', informDay: 7, dueDay: 10, bank: 'TMB', emiAmount: 91332, active: true },
          { id: 'ln5', vehicleNo: 'Kobalco-380', borrower: 'Rishi', loanNo: 'MELRB-2601230005', informDay: 7, dueDay: 10, bank: 'TMB', emiAmount: 188193, active: true },
          { id: 'ln6', vehicleNo: 'Hittachi-370', borrower: 'Arun', loanNo: 'MELRB-2511210002', informDay: 7, dueDay: 10, bank: 'CUB', emiAmount: 154164, active: true },
          { id: 'ln7', vehicleNo: 'PRD-250', borrower: 'Arun', loanNo: 'MELRB-2511210003', informDay: 7, dueDay: 10, bank: 'CUB', emiAmount: 90536, active: true },
          { id: 'ln8', vehicleNo: 'Hittachi-370 New', borrower: 'Kumar Stone', loanNo: 'MELRB-2602270005', informDay: 13, dueDay: 15, bank: 'TMB', emiAmount: 267571, active: true },
          { id: 'ln9', vehicleNo: 'Lorry-TN88L2691', borrower: 'Sibi', loanNo: 'MELRB-2607150002', informDay: 13, dueDay: 15, bank: 'FEDRAL', emiAmount: 95500, active: true },
          { id: 'ln10', vehicleNo: 'Car', borrower: 'MKB- Appa', loanNo: 'Sbi', informDay: 13, dueDay: 15, bank: 'TMB', emiAmount: 56000, active: true },
          { id: 'ln11', vehicleNo: 'Business- Loan', borrower: 'Arun', loanNo: 'MELRBTF-2505300001', informDay: 18, dueDay: 20, bank: 'CUB', emiAmount: 512000, active: true },
          { id: 'ln12', vehicleNo: 'Car', borrower: 'Saravanapriya', loanNo: 'Bank Of India', informDay: 23, dueDay: 25, bank: 'HDFC', emiAmount: 66000, active: true },
          { id: 'ln13', vehicleNo: 'Housing Loan', borrower: 'Arun', loanNo: 'Lvb', informDay: 3, dueDay: 5, bank: 'LVB', emiAmount: 30000, active: true },
        ];
      }
      if (!s.loanPayments) s.loanPayments = [];
      if (!s.gifts || !s.gifts.length) {
        s.gifts = [
          { id: 'gf1', place: 'ILLUPPOR', office: 'THASILTHAR', amount: 20000, dueDay: 7, active: true },
          { id: 'gf2', place: 'ANNAVASAL', office: 'RI & VAO (10+5)', amount: 15000, dueDay: 7, active: true },
          { id: 'gf3', place: 'ANNAVASAL', office: 'POLICE STATION', amount: 17000, dueDay: 7, active: true },
          { id: 'gf4', place: 'ILLUPPOR', office: 'ILLUPPOR', amount: 10000, dueDay: 7, active: true },
          { id: 'gf5', place: 'MELUR', office: 'MELUR (DSP)', amount: 10000, dueDay: 7, active: true },
          { id: 'gf6', place: 'MELUR', office: 'INSPECTER - MELUR (10+3)', amount: 13000, dueDay: 7, active: true },
          { id: 'gf7', place: 'MELUR', office: 'MELUR- THASILTHAR (10+3+2)', amount: 15000, dueDay: 7, active: true },
          { id: 'gf8', place: 'MELUR', office: 'KANNAN ( RI )', amount: 10000, dueDay: 7, active: true },
          { id: 'gf9', place: 'THIRUVATHOOR', office: 'RI', amount: 5000, dueDay: 7, active: true },
          { id: 'gf10', place: 'POOVANTHI', office: 'THASILTHAR -THIRUPPUVANAM (10+2)', amount: 12000, dueDay: 7, active: true },
          { id: 'gf11', place: 'MELUR', office: 'TRAFFIC POLICE', amount: 3000, dueDay: 7, active: true },
        ];
      }
      if (!s.giftPayments) s.giftPayments = [];
      if (!s.company) s.company = { ...COMPANY };
      ensureMastersDefaults(s);
      if (!Array.isArray(s.users) || !s.users.length) {
        const q1 = s.quarries?.[0]?.id;
        const q2 = s.quarries?.[1]?.id || q1;
        s.users = q1 ? defaultUsers(q1, q2) : [];
      }
      if (!Array.isArray(s.invoices)) {
        const qid = s.activeQuarryId || s.quarries?.[0]?.id;
        s.invoices = qid
          ? [
              {
                id: 'pi1',
                quarryId: qid,
                type: 'block',
                refNo: '1',
                date: '2026-08-04',
                partyId: 'p1',
                stateOfSupply: 'Tamil Nadu',
                priceWithTax: false,
                lines: [
                  {
                    id: 'pil1',
                    item: 'PS-101 — Multi colour rough granite blocks 320×170×140',
                    qty: 7.616,
                    unit: 'CBM',
                    price: 18000,
                    discPct: 0,
                    discAmt: 0,
                    taxPct: 18,
                    hsn: '2516',
                    markingId: 'mk1',
                  },
                  {
                    id: 'pil2',
                    item: 'PS-102 — Multi colour rough granite blocks 300×150×120',
                    qty: 5.4,
                    unit: 'CBM',
                    price: 18000,
                    discPct: 0,
                    discAmt: 0,
                    taxPct: 18,
                    hsn: '2516',
                    markingId: 'mk2',
                  },
                ],
                terms:
                  '1. Payment as per agreement.\n2. Unloading at buyer’s scope.\n3. Subject to Melur jurisdiction.',
                description:
                  'MATERIAL NAME — RAWSILK IVORY\nMARKED BY — MOOL SINGH\nNUMBER OF BLOCKS — 2',
                imageData: '',
                documentName: '',
                documentData: '',
                roundOff: true,
                orderNo: '',
                orderDate: '',
                fob: '',
                paymentTerms: '',
                currency: 'INR',
                status: 'saved',
              },
            ]
          : [];
      }
      (s.machineReadings || []).forEach((r) => {
        if (!r.date && r.month) {
          r.date = `${r.month}-${String(daysInMonth(r.month)).padStart(2, '0')}`;
        }
        if (r.date && !r.month) r.month = r.date.slice(0, 7);
      });
      // Migrate old flat machine rows (hours/diesel/days/rent/fy) → master + one reading
      if (Array.isArray(s.machines)) {
        s.machines = s.machines.map((m) => {
          if (m.vendorId != null || m.monthlyRent != null) {
            return {
              id: m.id || uid(),
              quarryId: m.quarryId,
              name: m.name,
              type: m.type || 'Other',
              vendorId: m.vendorId || '',
              monthlyRent: Number(m.monthlyRent != null ? m.monthlyRent : m.rent) || 0,
              active: m.active !== false,
            };
          }
          const id = m.id || uid();
          if (m.days != null || m.hours != null || m.rent != null) {
            const month =
              m.fy === '2026-27' ? '2026-08' : m.fy === '2025-26' ? '2025-08' : m.fy === '2024-25' ? '2024-08' : today().slice(0, 7);
            s.machineReadings.push({
              id: uid(),
              quarryId: m.quarryId,
              machineId: id,
              vendorId: '',
              month,
              startReading: '',
              closeReading: '',
              hours: m.hours != null ? Number(m.hours) : null,
              days: Number(m.days) || 0,
              diesel: Number(m.diesel) || 0,
              litPerHour: 0,
              rent: Number(m.rent) || 0,
            });
          }
          return {
            id,
            quarryId: m.quarryId,
            name: m.name,
            type: 'Other',
            vendorId: '',
            monthlyRent: Number(m.rent) || 0,
            active: true,
          };
        });
      }
      if (s.heads && !s.heads.includes('Labour Wage')) s.heads.push('Labour Wage');
      if (s.heads && !s.heads.includes('Salary')) s.heads.push('Salary');
      s.staff = normalizePeople(s.staff);
      s.labour = normalizeLabour(s.labour);
      (s.expenses || []).forEach((e) => {
        if (e.type === 'Expense') e.type = 'Debit';
        if (e.type === 'Sale') e.type = 'Credit';
      });
      const ledgerBefore = JSON.stringify(s.machineLedger || []);
      const expBefore = JSON.stringify(s.expenses || []);
      syncMachineLedgerFromReadings(s);
      syncMachVendorDebitsToCash(s);
      if (
        JSON.stringify(s.machineLedger || []) !== ledgerBefore ||
        JSON.stringify(s.expenses || []) !== expBefore
      ) {
        save(s);
      }
      return s;
    } catch {
      const s = syncMachVendorDebitsToCash(syncMachineLedgerFromReadings(seed()));
      save(s);
      return s;
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  let state = load();
  let sessionUserId = '';
  try {
    sessionUserId = localStorage.getItem(SESSION_KEY) || '';
  } catch {
    sessionUserId = '';
  }

  function currentUser() {
    return (state.users || []).find((u) => u.id === sessionUserId && u.active !== false) || null;
  }
  function userRole() {
    return currentUser()?.role || 'Viewer';
  }
  function isOwner() {
    return userRole() === 'Owner';
  }
  function isViewer() {
    return userRole() === 'Viewer';
  }
  function canEdit() {
    return userRole() === 'Owner' || userRole() === 'Accountant';
  }
  function canDeleteMasters() {
    return isOwner();
  }
  function allowedQuarries() {
    const u = currentUser();
    if (!u || u.role === 'Owner' || (u.quarryIds || []).includes('*')) return state.quarries || [];
    const ids = new Set(u.quarryIds || []);
    return (state.quarries || []).filter((q) => ids.has(q.id));
  }
  function canOpenPage(page) {
    if (!currentUser()) return false;
    if (page === 'users') return isOwner();
    if (isViewer()) return page === 'dashboard' || page === 'reports';
    return true;
  }
  function quarryAccessLabel(u) {
    if (!u) return '—';
    if (u.role === 'Owner' || (u.quarryIds || []).includes('*')) return 'All quarries';
    const names = (u.quarryIds || [])
      .map((id) => state.quarries.find((q) => q.id === id)?.name || id)
      .filter(Boolean);
    return names.join(', ') || 'None';
  }
  function setSession(id) {
    sessionUserId = id || '';
    try {
      if (sessionUserId) localStorage.setItem(SESSION_KEY, sessionUserId);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
  function ensureAllowedQuarry() {
    const allowed = allowedQuarries();
    if (!allowed.length) return false;
    if (!allowed.some((q) => q.id === state.activeQuarryId)) {
      const u = currentUser();
      const prefer = u?.lastQuarryId && allowed.some((q) => q.id === u.lastQuarryId) ? u.lastQuarryId : allowed[0].id;
      state.activeQuarryId = prefer;
      save(state);
    }
    return true;
  }
  function rememberUserQuarry(qid) {
    const u = currentUser();
    if (!u) return;
    u.lastQuarryId = qid;
    save(state);
  }
  function applyAccess() {
    const u = currentUser();
    document.body.classList.toggle('logged-out', !u);
    document.body.classList.toggle('role-owner', u?.role === 'Owner');
    document.body.classList.toggle('role-accountant', u?.role === 'Accountant');
    document.body.classList.toggle('role-viewer', u?.role === 'Viewer');
    const chip = $('#userChipName');
    const av = $('#userAvatar');
    if (chip) chip.textContent = u ? u.name : 'Sign in';
    if (av) av.textContent = u ? (u.name || 'U').trim().charAt(0).toUpperCase() : '?';
    const meta = $('#userMenuMeta');
    if (meta) {
      meta.innerHTML = u
        ? `<strong>${u.name}</strong>${u.role}<br/>${quarryAccessLabel(u)}`
        : '';
    }
  }
  function showLogin() {
    document.body.classList.add('logged-out');
    const gate = $('#loginGate');
    if (gate) gate.hidden = false;
    $('#loginErr')?.setAttribute('hidden', '');
  }
  function hideLogin() {
    const gate = $('#loginGate');
    if (gate) gate.hidden = true;
    document.body.classList.remove('logged-out');
  }
  function signOut() {
    setSession('');
    $('#userMenu')?.classList.remove('open');
    applyAccess();
    showLogin();
    toast('Signed out');
  }
  function signIn(username, password) {
    const uname = (username || '').trim().toLowerCase();
    const user = (state.users || []).find(
      (u) => u.active !== false && (u.username || '').toLowerCase() === uname && u.password === password
    );
    if (!user) return false;
    setSession(user.id);
    if (user.lastQuarryId) state.activeQuarryId = user.lastQuarryId;
    ensureAllowedQuarry();
    save(state);
    hideLogin();
    applyAccess();
    if (!(location.hash || '').replace(/^#/, '') || !canOpenPage((location.hash || '').replace(/^#/, '').split('/')[0])) {
      history.replaceState(null, '', isViewer() ? '#dashboard' : '#dashboard');
    }
    applyRoute();
    toast('Signed in · ' + user.name + ' (' + user.role + ')');
    return true;
  }

  function activeQuarry() {
    return state.quarries.find((q) => q.id === state.activeQuarryId) || state.quarries[0];
  }

  function activeYear() {
    return state.activeYear || currentFy();
  }

  function inFy(dateStr, fy) {
    return fyFromDate(dateStr) === fy;
  }

  /** Quarry-scoped (all years) — used by modules */
  function quarryExpenses() {
    return state.expenses.filter((e) => e.quarryId === state.activeQuarryId);
  }

  function quarryMarkings() {
    return state.markings.filter((m) => m.quarryId === state.activeQuarryId);
  }

  function quarryLabourAll() {
    return state.labour.filter((l) => l.quarryId === state.activeQuarryId);
  }

  function labourFyKey() {
    return $('#smLabourFy')?.value || $('#labourFy')?.value || activeYear();
  }

  function quarryLabour(fy = labourFyKey()) {
    return quarryLabourAll().filter((l) => !fy || l.fy === fy);
  }

  function normalizeLabour(list) {
    return (list || []).map((l) => ({
      mastiri: 0,
      openingAdvance: l.openingAdvance != null ? Number(l.openingAdvance) : Number(l.advance || 0),
      otNight: Number(l.otNight || 0),
      otNightRate: Number(l.otNightRate || l.dayRate || 0),
      otHours: Number(l.otHours || 0),
      otHourRate: Number(l.otHourRate || (Number(l.dayRate || 0) / 8) || 0),
      ...l,
      days: Number(l.days || 0),
      dayRate: Number(l.dayRate || 0),
      mastiri: Number(l.mastiri || 0),
      openingAdvance:
        l.openingAdvance != null ? Number(l.openingAdvance) : Number(l.advance || 0),
    }));
  }

  function quarryMachines() {
    return (state.machines || []).filter((m) => m.quarryId === state.activeQuarryId);
  }

  function quarryMachineReadings() {
    return (state.machineReadings || []).filter((r) => r.quarryId === state.activeQuarryId);
  }

  function quarryMachineLedger() {
    return (state.machineLedger || []).filter((e) => e.quarryId === state.activeQuarryId);
  }

  function machineTypesList() {
    const set = new Set([...(state.machineTypes || DEFAULT_MACHINE_TYPES), ...DEFAULT_MACHINE_TYPES]);
    quarryMachines().forEach((m) => m.type && set.add(m.type));
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  function daysInMonth(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }

  function readingHoursLabel(r) {
    if (r.startReading === 'Full' || r.closeReading === 'Full') return 'Full';
    if (r.hours == null || r.hours === '') return '—';
    return Number(r.hours).toFixed(1);
  }

  function readingMeterLabel(v) {
    if (v === 'Full' || v === 'full') return 'Full';
    if (v === '' || v == null) return '—';
    return String(v);
  }

  function suggestProRataRent(monthlyRent, days, ym) {
    const dim = daysInMonth(ym || today().slice(0, 7));
    if (!dim || !days) return 0;
    return Math.round((Number(monthlyRent) || 0) * (Number(days) / dim));
  }

  function vendorOptionsHtml(selectedId, allowEmpty) {
    const vendors = state.parties.filter((p) => p.type === 'Vendor' || p.type === 'Both');
    vendors.sort((a, b) => a.name.localeCompare(b.name));
    return (
      (allowEmpty ? `<option value="">— select vendor —</option>` : '') +
      vendors.map((p) => `<option value="${p.id}"${p.id === selectedId ? ' selected' : ''}>${p.name}</option>`).join('') +
      `<option value="__new__">+ Add new vendor…</option>`
    );
  }

  function machineTypeOptionsHtml(selected) {
    return (
      machineTypesList()
        .map((t) => `<option value="${t}"${t === selected ? ' selected' : ''}>${t}</option>`)
        .join('') + `<option value="__new__">+ Add type…</option>`
    );
  }

  /** FY filter — Dashboard / Reports only */
  function dashExpenses() {
    return quarryExpenses().filter((e) => inFy(e.date, activeYear()));
  }

  function dashMarkings() {
    return quarryMarkings().filter((m) => inFy(m.date, activeYear()));
  }

  function contextLabel() {
    return activeQuarry().name;
  }

  function personStatus(p) {
    return p.exitDate ? 'Left' : 'Active';
  }

  function isActiveInMonth(p, ym) {
    if (!p || p.quarryId !== state.activeQuarryId) return false;
    const [y, m] = ym.split('-').map(Number);
    const monthStart = `${ym}-01`;
    const monthEnd = `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
    const join = p.joinDate || '2000-01-01';
    if (join > monthEnd) return false;
    if (p.exitDate && p.exitDate < monthStart) return false;
    return true;
  }

  function peopleForMonth(ym, category) {
    return state.staff.filter((p) => {
      if (!isActiveInMonth(p, ym)) return false;
      if (category && category !== 'all' && (p.category || 'Staff') !== category) return false;
      return true;
    });
  }

  function normalizePeople(list) {
    return (list || []).map((p) => {
      const person = {
        category: 'Staff',
        basic: p.basic || 0,
        dailyRate: p.dailyRate || 0,
        joinDate: p.joinDate || '2024-07-01',
        exitDate: p.exitDate || null,
        exitReason: p.exitReason || '',
        bankName: '',
        bankAc: '',
        ifsc: '',
        phone: '',
        email: '',
        address: '',
        emergencyPhone: '',
        notes: '',
        code: '',
        aadhaar: '',
        pan: '',
        photo: '',
        attachments: [],
        employment: [],
        ...p,
        category: p.category || 'Staff',
        bankName: p.bankName || '',
        bankAc: p.bankAc || '',
        ifsc: p.ifsc || '',
        phone: p.phone || '',
        email: p.email || '',
        address: p.address || '',
        emergencyPhone: p.emergencyPhone || '',
        notes: p.notes || '',
        code: p.code || '',
        aadhaar: p.aadhaar || '',
        pan: p.pan || '',
        photo: p.photo || '',
        attachments: Array.isArray(p.attachments) ? p.attachments : [],
      };
      person.employment = ensureEmploymentHistory(person);
      return person;
    });
  }

  function ensureEmploymentHistory(p) {
    const list = Array.isArray(p.employment) ? [...p.employment] : [];
    if (!list.length && p.joinDate) {
      list.push({ kind: 'Join', date: p.joinDate, note: 'Joined' });
      if (p.exitDate) list.push({ kind: 'Exit', date: p.exitDate, note: p.exitReason || 'Left' });
    }
    return list.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
  }

  function pushEmployment(p, kind, date, note) {
    if (!p.employment) p.employment = ensureEmploymentHistory(p);
    p.employment.push({ kind, date, note: note || kind });
    p.employment.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
  }

  function companyOf() {
    return { ...COMPANY, ...(state.company || {}) };
  }

  function companyBanks() {
    return Array.isArray(state.banks) && state.banks.length ? state.banks : defaultBanks();
  }

  function bankLine() {
    const banks = companyBanks();
    if (!banks.length) return companyOf().banks || '';
    return banks
      .map((b) => {
        const name = [b.name, b.branch].filter(Boolean).join(' ');
        const ac = b.acNo ? ` A/c ${b.acNo}` : '';
        const ifsc = b.ifsc ? ` · ${b.ifsc}` : '';
        return `${name}${ac}${ifsc}`;
      })
      .join(' · ');
  }

  function quarryRates(qid = state.activeQuarryId) {
    const q = (state.quarries || []).find((x) => x.id === qid) || {};
    return {
      gstPct: q.gstPct != null ? Number(q.gstPct) : Number(state.gstRate) || 18,
      royaltyRate: q.royaltyRate != null ? Number(q.royaltyRate) : Number(state.royaltyRate) || 2500,
      slabRate: q.slabRate != null ? Number(q.slabRate) : 92,
      cbmRates: { ...DEFAULT_CBM_RATES, ...(q.cbmRates || {}) },
    };
  }

  function defaultCbmRate(choice, qid) {
    const rates = quarryRates(qid).cbmRates;
    return Number(rates[choice] || rates.I || 18000);
  }

  function volCBM(m) {
    return (Number(m.l) * Number(m.w) * Number(m.h)) / 1e6;
  }

  function markGstPct(m) {
    const n = Number(m?.gstPct);
    if (Number.isFinite(n) && n >= 0) return n;
    return quarryRates(m?.quarryId || state.activeQuarryId).gstPct;
  }

  function markGross(m) {
    return volCBM(m) * Number(m.rate || 0);
  }

  function markGstAmt(m) {
    return markGross(m) * (markGstPct(m) / 100);
  }

  function markTotal(m) {
    return markGross(m) + markGstAmt(m);
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- Navigation (hash routes: #page or #staff/<id>) ---------- */
  let selectedStaffMgmtId = null;
  let selectedGangId = null;
  let selectedLoanId = null;
  let selectedSaleId = null;
  let selectedPiId = null;
  let saleTab = 'sales'; // sales | payments
  let importRows = [];
  let staffProfileExpanded = false;
  let staffDetailTab = 'txns';
  let staffDetailTxnScope = 'overall'; // overall | month
  let staffDetailTxnYm = null;
  let staffDetailTxnType = 'all'; // all | Salary | Advance | Other
  let staffMgmtSort = 'name';
  let staffAttYm = null;
  let staffAttView = 'day'; // day | month
  let staffAttDate = null;
  let staffAttScope = 'staff'; // staff | gangs
  let staffSalYm = null;
  let staffSalTab = 'pay'; // pay | adv
  let staffAdvView = 'month'; // day | month
  let staffAdvDate = null;

  function parseHash() {
    const raw = (location.hash || '').replace(/^#/, '').trim();
    if (!raw) return { page: 'dashboard', staffId: null, gangId: null, partyId: null, loanId: null, saleId: null, piId: null };
    const parts = raw.split('/').filter(Boolean);
    const head = parts[0] || 'dashboard';
    if (head === 'staff' && parts[1]) {
      return { page: 'staffdetail', staffId: parts[1], gangId: null, partyId: null, loanId: null, saleId: null, piId: null };
    }
    if (head === 'gang' && parts[1]) {
      return { page: 'gangdetail', staffId: null, gangId: parts[1], partyId: null, loanId: null, saleId: null, piId: null };
    }
    if (head === 'customer' && parts[1]) {
      return { page: 'customerdetail', staffId: null, gangId: null, partyId: parts[1], loanId: null, saleId: null, piId: null };
    }
    if (head === 'vendor' && parts[1]) {
      return { page: 'vendordetail', staffId: null, gangId: null, partyId: parts[1], loanId: null, saleId: null, piId: null };
    }
    if (head === 'loan' && parts[1]) {
      return { page: 'loandetail', staffId: null, gangId: null, partyId: null, loanId: parts[1], saleId: null, piId: null };
    }
    if (head === 'invoice' && parts[1]) {
      return { page: 'saledetail', staffId: null, gangId: null, partyId: null, loanId: null, saleId: parts[1], piId: null };
    }
    if (head === 'pi') {
      return { page: 'pieditor', staffId: null, gangId: null, partyId: null, loanId: null, saleId: null, piId: parts[1] || 'new' };
    }
    if (head === 'parties') {
      return { page: 'customers', staffId: null, gangId: null, partyId: null, loanId: null, saleId: null, piId: null };
    }
    return { page: head, staffId: null, gangId: null, partyId: null, loanId: null, saleId: null, piId: null };
  }

  function routeHash(page, opts = {}) {
    if ((page === 'staff' || page === 'staffdetail') && opts.staffId) return `staff/${opts.staffId}`;
    if ((page === 'gang' || page === 'gangdetail') && opts.gangId) return `gang/${opts.gangId}`;
    if ((page === 'customer' || page === 'customerdetail') && opts.partyId) return `customer/${opts.partyId}`;
    if ((page === 'vendor' || page === 'vendordetail') && opts.partyId) return `vendor/${opts.partyId}`;
    if ((page === 'loan' || page === 'loandetail') && opts.loanId) return `loan/${opts.loanId}`;
    if ((page === 'invoice' || page === 'saledetail') && opts.saleId) return `invoice/${opts.saleId}`;
    if (page === 'pieditor') return opts.piId ? `pi/${opts.piId}` : 'pi/new';
    if (page === 'staffdetail' || page === 'gangdetail') return 'staffmgmt';
    if (page === 'customerdetail') return 'customers';
    if (page === 'vendordetail') return 'vendors';
    if (page === 'loandetail') return 'finance';
    if (page === 'saledetail') return 'sale';
    if (page === 'pieditor') return 'invoices';
    return page;
  }

  function applyRoute() {
    if (!currentUser()) {
      showLogin();
      return;
    }
    hideLogin();
    ensureAllowedQuarry();
    let { page, staffId, gangId, partyId, loanId, saleId, piId } = parseHash();
    if (page === 'parties') {
      history.replaceState(null, '', '#customers');
      page = 'customers';
    }
    if (page === 'staffdetail') {
      const nextId =
        staffId &&
        state.staff.some((p) => p.id === staffId && (p.category || 'Staff') === 'Staff')
          ? staffId
          : null;
      if (nextId !== selectedStaffMgmtId) {
        staffProfileExpanded = false;
        staffDetailTab = 'txns';
        staffDetailTxnScope = 'overall';
        staffDetailTxnYm = null;
        staffDetailTxnType = 'all';
      }
      selectedStaffMgmtId = nextId;
      selectedGangId = null;
      selectedCustomerId = null;
      selectedVendorId = null;
      selectedLoanId = null;
      selectedSaleId = null;
      selectedPiId = null;
      if (!selectedStaffMgmtId) {
        history.replaceState(null, '', '#staffmgmt');
        page = 'staffmgmt';
        staffId = null;
      }
    } else if (page === 'gangdetail') {
      const nextGang =
        gangId && state.labour.some((l) => l.id === gangId && l.quarryId === state.activeQuarryId)
          ? gangId
          : null;
      selectedGangId = nextGang;
      selectedStaffMgmtId = null;
      selectedCustomerId = null;
      selectedVendorId = null;
      selectedLoanId = null;
      selectedSaleId = null;
      selectedPiId = null;
      if (!selectedGangId) {
        history.replaceState(null, '', '#staffmgmt');
        page = 'staffmgmt';
        gangId = null;
        staffMgmtTab = 'gangs';
      }
    } else if (page === 'customerdetail') {
      const next =
        partyId && state.parties.some((p) => p.id === partyId && isCustomerParty(p) && p.type !== 'Vendor')
          ? partyId
          : null;
      if (next !== selectedCustomerId) partyProfileExpanded = false;
      selectedCustomerId = next;
      selectedVendorId = null;
      selectedStaffMgmtId = null;
      selectedGangId = null;
      selectedLoanId = null;
      selectedSaleId = null;
      selectedPiId = null;
      if (!selectedCustomerId) {
        history.replaceState(null, '', '#customers');
        page = 'customers';
      }
    } else if (page === 'vendordetail') {
      const next =
        partyId && state.parties.some((p) => p.id === partyId && isVendorParty(p)) ? partyId : null;
      if (next !== selectedVendorId) partyProfileExpanded = false;
      selectedVendorId = next;
      selectedCustomerId = null;
      selectedStaffMgmtId = null;
      selectedGangId = null;
      selectedLoanId = null;
      selectedSaleId = null;
      selectedPiId = null;
      if (!selectedVendorId) {
        history.replaceState(null, '', '#vendors');
        page = 'vendors';
      }
    } else if (page === 'loandetail') {
      const next = loanId && (state.loans || []).some((l) => l.id === loanId) ? loanId : null;
      selectedLoanId = next;
      selectedStaffMgmtId = null;
      selectedGangId = null;
      selectedCustomerId = null;
      selectedVendorId = null;
      selectedSaleId = null;
      selectedPiId = null;
      if (!selectedLoanId) {
        history.replaceState(null, '', '#finance');
        page = 'finance';
      }
    } else if (page === 'saledetail') {
      const next = saleId && (state.markings || []).some((m) => m.id === saleId) ? saleId : null;
      selectedSaleId = next;
      selectedStaffMgmtId = null;
      selectedGangId = null;
      selectedCustomerId = null;
      selectedVendorId = null;
      selectedLoanId = null;
      selectedPiId = null;
      if (!selectedSaleId) {
        history.replaceState(null, '', '#sale');
        page = 'sale';
      }
    } else if (page === 'pieditor') {
      const next =
        !piId || piId === 'new'
          ? 'new'
          : (state.invoices || []).some((inv) => inv.id === piId)
            ? piId
            : null;
      selectedPiId = next;
      selectedStaffMgmtId = null;
      selectedGangId = null;
      selectedCustomerId = null;
      selectedVendorId = null;
      selectedLoanId = null;
      selectedSaleId = null;
      if (!selectedPiId) {
        history.replaceState(null, '', '#invoices');
        page = 'invoices';
      }
    } else {
      selectedStaffMgmtId = null;
      selectedGangId = null;
      selectedLoanId = null;
      selectedSaleId = null;
      selectedPiId = null;
      if (page !== 'customers') selectedCustomerId = null;
      if (page !== 'vendors') selectedVendorId = null;
      staffProfileExpanded = false;
      staffDetailTab = 'txns';
      staffDetailTxnScope = 'overall';
      staffDetailTxnYm = null;
      staffDetailTxnType = 'all';
    }
    if (!$('#page-' + page)) {
      page = 'dashboard';
      if ((location.hash || '').replace(/^#/, '') !== 'dashboard') {
        history.replaceState(null, '', '#dashboard');
      }
    }
    if (!canOpenPage(page)) {
      page = 'dashboard';
      history.replaceState(null, '', '#dashboard');
      toast(isViewer() ? 'Viewer can open Dashboard & P&L only' : 'No access to that screen');
    }
    $$('.page').forEach((p) => p.classList.toggle('active', p.id === 'page-' + page));
    $$('.nav-item, #bottomNav button').forEach((b) => {
      const navPage = b.dataset.page;
      b.classList.toggle(
        'active',
        navPage === page ||
          ((page === 'staffdetail' || page === 'gangdetail') && navPage === 'staffmgmt') ||
          (page === 'customerdetail' && navPage === 'customers') ||
          (page === 'vendordetail' && navPage === 'vendors') ||
          (page === 'loandetail' && navPage === 'finance') ||
          (page === 'saledetail' && navPage === 'sale') ||
          (page === 'pieditor' && navPage === 'invoices')
      );
    });
    syncNavSections(page);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const NAV_COLLAPSE_KEY = 'arun_nav_collapsed_v1';

  function loadNavCollapsed() {
    try {
      return JSON.parse(localStorage.getItem(NAV_COLLAPSE_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }

  function saveNavCollapsed(map) {
    try {
      localStorage.setItem(NAV_COLLAPSE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }

  function setNavSectionOpen(section, open) {
    if (!section) return;
    section.classList.toggle('collapsed', !open);
    const btn = section.querySelector('.nav-label');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function syncNavSections(page) {
    const collapsed = loadNavCollapsed();
    $$('#sideNav .nav-section').forEach((section) => {
      const id = section.dataset.nav;
      const hasActive = !!section.querySelector('.nav-item.active');
      section.classList.toggle('has-active', hasActive);
      // Keep the active section open so the current page stays visible
      if (hasActive) {
        setNavSectionOpen(section, true);
        if (id) {
          collapsed[id] = false;
          saveNavCollapsed(collapsed);
        }
      } else if (id && collapsed[id]) {
        setNavSectionOpen(section, false);
      } else {
        setNavSectionOpen(section, true);
      }
    });
  }

  $$('#sideNav .nav-label').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.nav-section');
      if (!section) return;
      const id = section.dataset.nav;
      const open = section.classList.contains('collapsed');
      setNavSectionOpen(section, open);
      if (id) {
        const collapsed = loadNavCollapsed();
        collapsed[id] = !open;
        saveNavCollapsed(collapsed);
      }
    });
  });

  function go(page, opts = {}) {
    const next = routeHash(page, opts);
    const cur = (location.hash || '').replace(/^#/, '');
    if (cur === next) applyRoute();
    else location.hash = next;
  }

  window.addEventListener('hashchange', applyRoute);

  $$('.nav-item, #bottomNav button').forEach((btn) => {
    btn.addEventListener('click', () => {
      go(btn.dataset.page);
      $('#sideNav').style.display = '';
    });
  });

  $('#menuToggle').addEventListener('click', () => {
    const nav = $('#sideNav');
    if (getComputedStyle(nav).display === 'none' || nav.style.display === 'none') {
      nav.style.display = 'flex';
      nav.style.position = 'fixed';
      nav.style.left = '0';
      nav.style.zIndex = '45';
      nav.style.background = '#ffffff';
    } else {
      nav.style.display = '';
      nav.style.position = '';
    }
  });

  /* ---------- Quarry switcher (header) ---------- */
  function closeSwitchers() {
    $('#quarrySwitcher')?.classList.remove('open');
    $('#userMenu')?.classList.remove('open');
  }

  function renderSwitcher() {
    const q = activeQuarry();
    $('#quarryLabel').textContent = q?.name || '—';
    const menu = $('#quarryMenu');
    const list = allowedQuarries();
    menu.innerHTML = list
      .map(
        (x) => `
      <button class="switcher-item ${x.id === q.id ? 'active' : ''}" data-qid="${x.id}">
        <span class="name">${x.name}</span>
        <span class="meta">${x.code} · ${x.place}</span>
      </button>`
      )
      .join('');
    $$('.switcher-item', menu).forEach((item) => {
      item.addEventListener('click', () => {
        state.activeQuarryId = item.dataset.qid;
        rememberUserQuarry(state.activeQuarryId);
        save(state);
        closeSwitchers();
        toast('Quarry: ' + activeQuarry().name);
        render();
      });
    });
  }

  function ensureDashYearOptions() {
    const sel = $('#dashYear');
    if (!sel) return;
    const years = state.years || ['2024-25', '2025-26', '2026-27'];
    const prev = sel.value || activeYear();
    sel.innerHTML = years.map((y) => `<option value="${y}">FY ${y}</option>`).join('');
    sel.value = years.includes(prev) ? prev : activeYear();
    if (!sel.dataset.bound) {
      sel.dataset.bound = '1';
      sel.addEventListener('change', () => {
        state.activeYear = sel.value;
        save(state);
        const reportSel = $('#reportYear');
        if (reportSel) reportSel.value = state.activeYear;
        render();
      });
    }
  }

  function ensureReportYearOptions() {
    const sel = $('#reportYear');
    if (!sel) return;
    const years = state.years || ['2024-25', '2025-26', '2026-27'];
    const prev = sel.value || activeYear();
    sel.innerHTML = years.map((y) => `<option value="${y}">FY ${y}</option>`).join('');
    sel.value = years.includes(prev) ? prev : activeYear();
    if (!sel.dataset.bound) {
      sel.dataset.bound = '1';
      sel.addEventListener('change', () => {
        state.activeYear = sel.value;
        save(state);
        const dashSel = $('#dashYear');
        if (dashSel) dashSel.value = state.activeYear;
        renderReports();
        if ($('.page.active')?.id === 'page-dashboard') renderDashboard();
      });
    }
  }

  $('#quarryBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const open = $('#quarrySwitcher').classList.contains('open');
    closeSwitchers();
    if (!open) $('#quarrySwitcher').classList.add('open');
  });
  document.addEventListener('click', closeSwitchers);

  /* ---------- Modal ---------- */
  function openModal(title, bodyHtml, onSave, opts = {}) {
    const box = $('#modal .modal');
    box?.classList.toggle('large', !!opts.large && !opts.xlarge);
    box?.classList.toggle('xlarge', !!opts.xlarge);
    box?.classList.toggle('party-modal', !!opts.party);
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = bodyHtml;
    const extra = opts.saveAndNew
      ? `<button class="btn btn-ghost" type="button" id="modalSaveNew">Save &amp; New</button>`
      : '';
    $('#modalActions').innerHTML = `
      <button class="btn btn-ghost" type="button" id="modalCancel">Cancel</button>
      ${extra}
      <button class="btn btn-primary" type="button" id="modalSave">Save</button>`;
    $('#modal').classList.add('open');
    const close = () => {
      $('#modal').classList.remove('open');
      box?.classList.remove('large');
      box?.classList.remove('xlarge');
      box?.classList.remove('party-modal');
    };
    $('#modalCancel').onclick = close;
    $('#modalClose').onclick = close;
    const runSave = (andNew) => {
      const result = onSave({ andNew: !!andNew });
      if (result === false) return;
      save(state);
      if (andNew) return;
      close();
      if (typeof opts.onAfterSave === 'function') opts.onAfterSave(result);
      else render();
    };
    $('#modalSave').onclick = () => runSave(false);
    $('#modalSaveNew')?.addEventListener('click', () => runSave(true));
    return { close };
  }

  /* ---------- Pages ---------- */
  function renderDashboard() {
    ensureDashYearOptions();
    const q = activeQuarry();
    $('#dashPill').textContent = q.name;
    const ex = dashExpenses();
    const debit = ex.reduce((s, e) => s + Number(e.debit), 0);
    const credit = ex.reduce((s, e) => s + Number(e.credit), 0);
    const marks = dashMarkings();
    const totalCbm = marks.reduce((s, m) => s + volCBM(m), 0);
    const sales = marks.reduce((s, m) => s + markTotal(m), 0);
    const staffCount = state.staff.filter((s) => s.quarryId === state.activeQuarryId && !s.exitDate).length;
    const workerCount = state.staff.filter((s) => s.quarryId === state.activeQuarryId && !s.exitDate && s.category === 'Worker').length;

    $('#dashStats').innerHTML = `
      <div class="card"><h3>Cash balance</h3><div class="stat ${credit - debit >= 0 ? 'ok' : 'danger'}">${money(credit - debit)}</div><div class="hint">FY ${activeYear()}</div></div>
      <div class="card"><h3>Year expenses</h3><div class="stat warn">${money(debit)}</div><div class="hint">${ex.length} vouchers · FY ${activeYear()}</div></div>
      <div class="card"><h3>Production</h3><div class="stat">${cbm(totalCbm)} CBM</div><div class="hint">${marks.length} blocks · ${money(sales)}</div></div>
      <div class="card"><h3>Active people</h3><div class="stat">${staffCount}</div><div class="hint">${staffCount - workerCount} staff · ${workerCount} workers</div></div>`;

    renderDashCharts(ex, marks);

    const recentEx = [...quarryExpenses()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    $('#dashExpenses').innerHTML = recentEx.length
      ? `<div class="list-compact">${recentEx
          .map(
            (e) => `<div class="list-row"><div><div class="t">${e.particulars}</div><div class="s">${e.date} · ${e.head}</div></div>
            <div class="num">${e.debit ? '−' + money(e.debit) : '+' + money(e.credit)}</div></div>`
          )
          .join('')}</div>`
      : `<div class="empty">No expenses for ${q.name}</div>`;

    const recentM = [...quarryMarkings()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    $('#dashMarkings').innerHTML = recentM.length
      ? `<div class="list-compact">${recentM
          .map((m) => {
            const p = state.parties.find((x) => x.id === m.partyId);
            return `<div class="list-row"><div><div class="t">${m.blockNo} · ${p?.name || ''}</div><div class="s">${m.date} · ${cbm(volCBM(m))} CBM · GST ${markGstPct(m)}%</div></div>
            <div class="num">${money(markTotal(m))}</div></div>`;
          })
          .join('')}</div>`
      : `<div class="empty">No markings for ${q.name}</div>`;
  }

  const dashChartInstances = {};
  const DASH_CHART_COLORS = [
    '#b07a3a',
    '#3d7a5f',
    '#c44b3c',
    '#4a6fa5',
    '#b8860b',
    '#6b5b95',
    '#2f8f5b',
    '#8b6b4a',
    '#5a7d9a',
    '#a05a5a',
  ];

  function fyMonthKeys(fy) {
    const startY = Number(String(fy || currentFy()).split('-')[0]);
    if (!startY) return [];
    const months = [];
    for (let i = 0; i < 12; i++) {
      const m = ((3 + i) % 12) + 1; // Apr … Mar
      const y = m >= 4 ? startY : startY + 1;
      months.push(`${y}-${String(m).padStart(2, '0')}`);
    }
    return months;
  }

  function destroyDashChart(key) {
    if (dashChartInstances[key]) {
      dashChartInstances[key].destroy();
      delete dashChartInstances[key];
    }
  }

  function paintDashChart(key, canvasId, config) {
    const canvas = $(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyDashChart(key);
    const wrap = canvas.parentElement;
    if (wrap) {
      wrap.querySelectorAll('.dash-chart-empty').forEach((el) => el.remove());
      canvas.style.display = '';
    }
    dashChartInstances[key] = new Chart(canvas.getContext('2d'), config);
  }

  function emptyDashChart(key, canvasId, msg) {
    destroyDashChart(key);
    const canvas = $(canvasId);
    if (!canvas) return;
    canvas.style.display = 'none';
    const wrap = canvas.parentElement;
    if (!wrap) return;
    let empty = wrap.querySelector('.dash-chart-empty');
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'dash-chart-empty';
      wrap.appendChild(empty);
    }
    empty.textContent = msg;
  }

  function chartMoneyTick(v) {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return `₹${n}`;
  }

  function renderDashCharts(ex, marks) {
    const fy = activeYear();
    if ($('#dashCashHint')) $('#dashCashHint').textContent = `FY ${fy} · Credit vs Debit`;

    if (typeof Chart === 'undefined') {
      ['dashCashChart', 'dashExpensePie', 'dashProdChart', 'dashCustomerChart'].forEach((id) => {
        emptyDashChart(id, `#${id}`, 'Charts unavailable (Chart.js not loaded)');
      });
      return;
    }

    const months = fyMonthKeys(fy);
    const labels = months.map((ym) => {
      const [y, m] = ym.split('-');
      return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]} '${String(y).slice(2)}`;
    });
    const creditByM = months.map((ym) =>
      ex.filter((e) => e.date && e.date.startsWith(ym)).reduce((s, e) => s + (Number(e.credit) || 0), 0)
    );
    const debitByM = months.map((ym) =>
      ex.filter((e) => e.date && e.date.startsWith(ym)).reduce((s, e) => s + (Number(e.debit) || 0), 0)
    );
    const hasCash = creditByM.some((v) => v > 0) || debitByM.some((v) => v > 0);

    if (hasCash) {
      paintDashChart('cash', '#dashCashChart', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Credit',
              data: creditByM,
              backgroundColor: 'rgba(47, 143, 91, 0.75)',
              borderColor: '#2f8f5b',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Debit',
              data: debitByM,
              backgroundColor: 'rgba(196, 75, 60, 0.7)',
              borderColor: '#c44b3c',
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${money(ctx.parsed.y || 0)}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
            y: {
              beginAtZero: true,
              ticks: { callback: chartMoneyTick, font: { size: 10 } },
              grid: { color: 'rgba(213,221,229,.7)' },
            },
          },
        },
      });
    } else {
      emptyDashChart('cash', '#dashCashChart', 'No cash vouchers this FY');
    }

    const byHead = {};
    ex.forEach((e) => {
      const amt = Number(e.debit) || 0;
      if (!amt) return;
      const head = e.head || 'Other';
      byHead[head] = (byHead[head] || 0) + amt;
    });
    const headRows = Object.entries(byHead)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    if (headRows.length) {
      paintDashChart('expensePie', '#dashExpensePie', {
        type: 'doughnut',
        data: {
          labels: headRows.map(([h]) => h),
          datasets: [
            {
              data: headRows.map(([, v]) => v),
              backgroundColor: headRows.map((_, i) => DASH_CHART_COLORS[i % DASH_CHART_COLORS.length]),
              borderWidth: 2,
              borderColor: '#fff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '58%',
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
                  const v = ctx.parsed || 0;
                  return `${ctx.label}: ${money(v)} (${Math.round((v / total) * 100)}%)`;
                },
              },
            },
          },
        },
      });
    } else {
      emptyDashChart('expensePie', '#dashExpensePie', 'No debit expenses this FY');
    }

    const cbmByM = months.map((ym) =>
      marks.filter((m) => m.date && m.date.startsWith(ym)).reduce((s, m) => s + volCBM(m), 0)
    );
    const saleByM = months.map((ym) =>
      marks.filter((m) => m.date && m.date.startsWith(ym)).reduce((s, m) => s + markTotal(m), 0)
    );
    if (cbmByM.some((v) => v > 0) || saleByM.some((v) => v > 0)) {
      paintDashChart('prod', '#dashProdChart', {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'CBM',
              data: cbmByM,
              borderColor: '#b07a3a',
              backgroundColor: 'rgba(176, 122, 58, 0.15)',
              fill: true,
              tension: 0.3,
              yAxisID: 'y',
              pointRadius: 3,
            },
            {
              label: 'Sale value',
              data: saleByM,
              borderColor: '#3d7a5f',
              backgroundColor: 'transparent',
              tension: 0.3,
              yAxisID: 'y1',
              borderDash: [5, 4],
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ctx.dataset.label === 'CBM'
                    ? `CBM: ${cbm(ctx.parsed.y || 0)}`
                    : `Sale: ${money(ctx.parsed.y || 0)}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
            y: {
              beginAtZero: true,
              position: 'left',
              title: { display: true, text: 'CBM', font: { size: 10 } },
              ticks: { font: { size: 10 } },
              grid: { color: 'rgba(213,221,229,.7)' },
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { callback: chartMoneyTick, font: { size: 10 } },
            },
          },
        },
      });
    } else {
      emptyDashChart('prod', '#dashProdChart', 'No markings this FY');
    }

    const byParty = {};
    marks.forEach((m) => {
      const id = m.partyId || '_none';
      byParty[id] = (byParty[id] || 0) + markTotal(m);
    });
    const partyRows = Object.entries(byParty)
      .map(([id, amt]) => ({
        name: id === '_none' ? 'Unassigned' : state.parties.find((p) => p.id === id)?.name || 'Party',
        amt,
      }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 6);
    if (partyRows.length) {
      paintDashChart('customers', '#dashCustomerChart', {
        type: 'bar',
        data: {
          labels: partyRows.map((r) => (r.name.length > 18 ? r.name.slice(0, 16) + '…' : r.name)),
          datasets: [
            {
              label: 'Marking value',
              data: partyRows.map((r) => r.amt),
              backgroundColor: partyRows.map((_, i) => DASH_CHART_COLORS[i % DASH_CHART_COLORS.length]),
              borderRadius: 4,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => money(ctx.parsed.x || 0),
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { callback: chartMoneyTick, font: { size: 10 } },
              grid: { color: 'rgba(213,221,229,.7)' },
            },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } },
          },
        },
      });
    } else {
      emptyDashChart('customers', '#dashCustomerChart', 'No customer markings this FY');
    }
  }

  function expenseMonthOptions() {
    const set = new Set(quarryExpenses().map((e) => e.date && e.date.slice(0, 7)).filter(Boolean));
    quarryMarkings().forEach((m) => {
      if (m.date) set.add(m.date.slice(0, 7));
    });
    set.add(today().slice(0, 7));
    return [...set].sort().reverse();
  }

  function ensureTxnMonthOptions(selId, onChange) {
    const sel = $(selId);
    if (!sel) return;
    const opts = expenseMonthOptions();
    const prev = sel.value;
    const qChanged = sel.dataset.qid !== state.activeQuarryId;
    sel.dataset.qid = state.activeQuarryId;
    sel.innerHTML =
      `<option value="all">All months</option>` +
      opts.map((v) => `<option value="${v}">${monthLabel(v)}</option>`).join('');
    if (qChanged || !prev || (prev !== 'all' && !opts.includes(prev))) {
      sel.value = opts[0] || 'all';
    } else {
      sel.value = opts.includes(prev) || prev === 'all' ? prev : opts[0] || 'all';
    }
    if (!sel.dataset.bound) {
      sel.dataset.bound = '1';
      sel.addEventListener('change', onChange);
    }
  }

  function voucherLinkLabel(e) {
    const party = e.partyId ? state.parties.find((x) => x.id === e.partyId) : null;
    if (party) return party.name;
    const p = e.personId ? state.staff.find((x) => x.id === e.personId) : null;
    if (p) return p.name;
    const g = e.labourId ? state.labour.find((x) => x.id === e.labourId) : null;
    if (g) return g.name;
    return '';
  }

  function renderTxnBook(kind) {
    // Purchase & Expense only — Sale has its own multi-payment UI
    const monthSel = '#purchaseMonth';
    const searchSel = '#purchaseSearch';
    const statsEl = '#purchaseStats';
    const tableEl = '#purchaseTable';
    ensureTxnMonthOptions(monthSel, () => renderTxnBook(kind));

    const month = $(monthSel)?.value || 'all';
    let rows = quarryExpenses().filter((e) => e.type === kind);
    if (month !== 'all') rows = rows.filter((e) => e.date && e.date.startsWith(month));
    const q = ($(searchSel)?.value || '').toLowerCase().trim();
    if (q) {
      rows = rows.filter((e) => {
        const link = voucherLinkLabel(e);
        return `${e.particulars} ${e.head} ${link}`.toLowerCase().includes(q);
      });
    }
    rows.sort((a, b) => {
      const byDate = String(b.date || '').localeCompare(String(a.date || ''));
      if (byDate) return byDate;
      const ia = state.expenses.indexOf(a);
      const ib = state.expenses.indexOf(b);
      return ib - ia;
    });
    const total = rows.reduce((s, e) => s + Number(e.debit), 0);
    const monthHint = month === 'all' ? 'All months' : monthLabel(month);
    $(statsEl).innerHTML = `<div class="card"><h3>Total debit</h3><div class="stat danger">${money(total)}</div></div>
         <div class="card"><h3>Entries</h3><div class="stat">${rows.length}</div><div class="hint">${monthHint}</div></div>
         <div class="card"><h3>Purchase &amp; Expense</h3><div class="stat danger">Debit</div><div class="hint">Cash out</div></div>
         <div class="card"><h3>Quarry</h3><div class="stat" style="font-size:1rem">${activeQuarry().name}</div></div>`;

    $(tableEl).innerHTML = rows.length
      ? rows
          .map((e) => {
            const link = voucherLinkLabel(e);
            return `<tr>
        <td>${e.date}</td>
        <td><span class="badge danger">${e.type}</span></td>
        <td>${e.head || '—'}</td>
        <td>${e.particulars}${link ? `<div class="s" style="color:var(--muted);font-size:.75rem">→ ${link}</div>` : ''}</td>
        <td class="num">${e.debit ? money(e.debit) : '—'}</td>
        <td><button class="icon-btn danger" data-del-ex="${e.id}" title="Delete" aria-label="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button></td>
      </tr>`;
          })
          .join('')
      : `<tr><td colspan="6"><div class="empty">No purchase / expense entries for ${monthHint}</div></td></tr>`;

    $$(`${tableEl} [data-del-ex]`).forEach((b) =>
      b.addEventListener('click', () => {
        deleteExpenseRow(b.dataset.delEx, () => renderTxnBook(kind));
      })
    );
  }

  function salePaymentsFor(markingId) {
    return quarryExpenses()
      .filter((e) => e.type === 'Credit' && e.markingId === markingId)
      .slice()
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  }

  function saleReceived(markingId) {
    return salePaymentsFor(markingId).reduce((s, e) => s + (Number(e.credit) || 0), 0);
  }

  function saleBalance(m) {
    return Math.round((markTotal(m) - saleReceived(m.id)) * 100) / 100;
  }

  function salePayStatus(m) {
    const total = markTotal(m);
    const recv = saleReceived(m.id);
    if (recv <= 0.5) return { key: 'unpaid', label: 'Unpaid', cls: 'danger' };
    if (recv + 0.5 >= total) return { key: 'paid', label: 'Paid', cls: 'ok' };
    return { key: 'partial', label: 'Partial', cls: 'warn' };
  }

  function refreshSaleViews() {
    if ($('.page.active')?.id === 'page-saledetail') renderSaleDetail();
    else if ($('.page.active')?.id === 'page-sale') renderSale();
  }

  function openReceiveSalePayment(preMarkingId) {
    const marks = quarryMarkings()
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || a.blockNo.localeCompare(b.blockNo));
    if (!marks.length) {
      toast('Add a block marking sale first');
      return;
    }
    const openMarks = marks.filter((m) => saleBalance(m) > 0.5);
    const list = openMarks.length ? openMarks : marks;
    const pre = preMarkingId && list.some((m) => m.id === preMarkingId) ? preMarkingId : list[0].id;
    const opts = list
      .map((m) => {
        const p = state.parties.find((x) => x.id === m.partyId);
        const bal = saleBalance(m);
        const st = salePayStatus(m);
        return `<option value="${m.id}" ${m.id === pre ? 'selected' : ''}>${m.date} · ${m.blockNo} · ${p?.name || '—'} · bal ${money(bal)} (${st.label})</option>`;
      })
      .join('');

    const syncAmt = () => {
      const m = state.markings.find((x) => x.id === $('#spSale')?.value);
      if (!m || !$('#spAmt')) return;
      const bal = Math.max(0, saleBalance(m));
      if (!$('#spAmt').dataset.touched) $('#spAmt').value = String(Math.round(bal) || '');
      if ($('#spHint')) {
        const st = salePayStatus(m);
        $('#spHint').innerHTML = `Sale ${money(markTotal(m))} · Received ${money(saleReceived(m.id))} · Balance <strong style="color:var(--text)">${money(saleBalance(m))}</strong> · ${st.label}. Enter full balance or any partial amount.`;
      }
    };

    openModal(
      'Receive payment',
      `<div class="form-grid cols-2">
        <label class="field" style="grid-column:1/-1"><span>Sale (block)</span>
          <select id="spSale">${opts}</select>
        </label>
        <label class="field"><span>Date</span><input type="date" id="spDate" value="${today()}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="spAmt" min="0" step="1" autofocus /></label>
        <label class="field" style="grid-column:1/-1"><span>Comment</span>
          <input id="spPart" placeholder="e.g. Partial cash / GPay / Bank" />
        </label>
        <p id="spHint" style="grid-column:1/-1;margin:0;color:var(--muted);font-size:.85rem"></p>
      </div>`,
      () => {
        const markingId = $('#spSale').value;
        const m = state.markings.find((x) => x.id === markingId);
        if (!m) {
          toast('Select a sale');
          return false;
        }
        const amt = Number($('#spAmt').value) || 0;
        if (amt <= 0) {
          toast('Amount required');
          return false;
        }
        const bal = saleBalance(m);
        if (amt > bal + 1) {
          toast('Amount is more than balance ' + money(bal));
          return false;
        }
        const party = state.parties.find((x) => x.id === m.partyId);
        const date = $('#spDate').value || today();
        const part =
          ($('#spPart').value || '').trim() ||
          `${amt + 0.5 >= bal ? 'Full' : 'Partial'} receipt — ${m.blockNo}${party ? ' · ' + party.name : ''}`;
        state.expenses.push({
          id: uid(),
          quarryId: state.activeQuarryId,
          date,
          type: 'Credit',
          head: 'Cash Received',
          particulars: part,
          debit: 0,
          credit: amt,
          partyId: m.partyId || '',
          markingId: m.id,
        });
        toast(amt + 0.5 >= bal ? 'Full payment received' : 'Partial payment received');
        return true;
      },
      { onAfterSave: () => refreshSaleViews() }
    );
    $('#spSale')?.addEventListener('change', () => {
      if ($('#spAmt')) delete $('#spAmt').dataset.touched;
      syncAmt();
    });
    $('#spAmt')?.addEventListener('input', () => {
      $('#spAmt').dataset.touched = '1';
    });
    syncAmt();
  }

  function renderSaleDetail() {
    const m = (state.markings || []).find((x) => x.id === selectedSaleId);
    if (!m || m.quarryId !== state.activeQuarryId) {
      go('sale');
      return;
    }
    const party = state.parties.find((x) => x.id === m.partyId);
    const total = markTotal(m);
    const recv = saleReceived(m.id);
    const bal = saleBalance(m);
    const st = salePayStatus(m);
    const pays = salePaymentsFor(m.id);

    if ($('#saleDetailTitle')) $('#saleDetailTitle').textContent = `Block ${m.blockNo}`;
    if ($('#saleDetailSub')) {
      $('#saleDetailSub').textContent = `${party?.name || '—'} · ${m.date} · ${cbm(volCBM(m))} CBM`;
    }
    if ($('#saleDetailBal')) {
      $('#saleDetailBal').innerHTML = `<small>Balance</small><strong class="${bal > 0.5 ? 'neg' : 'pos'}">${money(Math.abs(bal))}${
        bal > 0.5 ? ' due' : bal < -0.5 ? ' adv' : ''
      }</strong>`;
    }
    if ($('#saleDetailPayBtn')) {
      $('#saleDetailPayBtn').style.display = bal > 0.5 ? '' : 'none';
    }

    if ($('#saleDetailProfile')) {
      const row = (label, v) =>
        `<div class="staff-row"><dt>${label}</dt><dd${v ? '' : ' class="empty"'}>${v || '—'}</dd></div>`;
      $('#saleDetailProfile').innerHTML = `
        <div class="staff-profile">
          <div class="staff-profile-hero">
            <div class="staff-avatar" aria-hidden="true">${(m.blockNo || '?').slice(0, 2)}</div>
            <div class="staff-profile-hero-main">
              <h3>${m.blockNo}</h3>
              <div class="staff-profile-meta">
                <span class="badge ${st.cls}">${st.label}</span>
                <span style="color:var(--muted);font-size:.8rem">${party?.name || ''}</span>
              </div>
            </div>
            <div class="staff-profile-pay">
              <small>Sale value</small>
              <strong>${money(total)}</strong>
            </div>
          </div>
          <dl class="staff-profile-dl">
            ${row('Date', m.date)}
            ${row('Customer', party?.name)}
            ${row('Choice', m.choice)}
            ${row('Size (cm)', `${m.l}×${m.w}×${m.h}`)}
            ${row('CBM', cbm(volCBM(m)))}
            ${row('Rate', money(m.rate))}
            ${row('Gross', money(markGross(m)))}
            ${row('GST', `${markGstPct(m)}% · ${money(markGstAmt(m))}`)}
            ${row('Total', money(total))}
            ${row('Load', m.load)}
          </dl>
        </div>`;
    }

    if ($('#saleDetailStats')) {
      $('#saleDetailStats').innerHTML = `
        <div class="card"><h3>Sale</h3><div class="stat">${money(total)}</div><div class="hint">Incl. GST</div></div>
        <div class="card"><h3>Received</h3><div class="stat ok">${money(recv)}</div><div class="hint">${pays.length} payment${pays.length === 1 ? '' : 's'}</div></div>
        <div class="card"><h3>Balance</h3><div class="stat ${bal > 0.5 ? 'danger' : 'ok'}">${money(bal)}</div><div class="hint">${st.label}</div></div>
        <div class="card"><h3>Payments</h3><div class="stat">${pays.length}</div><div class="hint">Full or partial</div></div>`;
    }

    const tq = ($('#saleDetailPaySearch')?.value || '').toLowerCase().trim();
    let run = 0;
    let rows = pays.map((e) => {
      run += Number(e.credit) || 0;
      return { ...e, running: run };
    });
    rows = rows.slice().reverse();
    if (tq) {
      rows = rows.filter((e) => `${e.date} ${e.particulars} ${e.head}`.toLowerCase().includes(tq));
    }
    if ($('#saleDetailPayTable')) {
      $('#saleDetailPayTable').innerHTML = rows.length
        ? rows
            .map(
              (e) => `<tr>
                <td><span class="badge ok">Receipt</span></td>
                <td>${e.date}</td>
                <td>${e.particulars}</td>
                <td class="num">${money(e.credit)}</td>
                <td class="num">${money(e.running)}</td>
                <td><button type="button" class="icon-btn danger" data-del-sale-pay="${e.id}" title="Delete">✕</button></td>
              </tr>`
            )
            .join('')
        : `<tr><td colspan="6"><div class="empty">No payments yet — receive full or partial</div></td></tr>`;
      $$('#saleDetailPayTable [data-del-sale-pay]').forEach((b) =>
        b.addEventListener('click', () => {
          deleteExpenseRow(b.dataset.delSalePay, () => refreshSaleViews());
        })
      );
    }
  }

  function renderSaleSalesTab() {
    ensureTxnMonthOptions('#saleMonth', renderSale);
    const month = $('#saleMonth')?.value || 'all';
    const filter = $('#salePayFilter')?.value || 'all';
    const q = ($('#saleSearch')?.value || '').toLowerCase().trim();
    let rows = quarryMarkings().slice();
    if (month !== 'all') rows = rows.filter((m) => m.date && m.date.startsWith(month));
    rows = rows.map((m) => ({ m, st: salePayStatus(m), recv: saleReceived(m.id), bal: saleBalance(m), total: markTotal(m) }));
    if (filter !== 'all') rows = rows.filter((r) => r.st.key === filter);
    if (q) {
      rows = rows.filter((r) => {
        const p = state.parties.find((x) => x.id === r.m.partyId);
        return `${r.m.blockNo} ${r.m.date} ${p?.name || ''}`.toLowerCase().includes(q);
      });
    }
    rows.sort((a, b) => b.m.date.localeCompare(a.m.date) || a.m.blockNo.localeCompare(b.m.blockNo));

    const saleSum = rows.reduce((s, r) => s + r.total, 0);
    const recvSum = rows.reduce((s, r) => s + r.recv, 0);
    const balSum = rows.reduce((s, r) => s + Math.max(0, r.bal), 0);
    const partialN = rows.filter((r) => r.st.key === 'partial').length;
    $('#saleStats').innerHTML = `
      <div class="card"><h3>Sales</h3><div class="stat">${money(saleSum)}</div><div class="hint">${rows.length} blocks</div></div>
      <div class="card"><h3>Received</h3><div class="stat ok">${money(recvSum)}</div><div class="hint">Linked receipts</div></div>
      <div class="card"><h3>Outstanding</h3><div class="stat ${balSum ? 'danger' : 'ok'}">${money(balSum)}</div><div class="hint">Unpaid balance</div></div>
      <div class="card"><h3>Partial</h3><div class="stat warn">${partialN}</div><div class="hint">Multi-payment sales</div></div>`;

    $('#saleTable').innerHTML = rows.length
      ? rows
          .map(({ m, st, recv, bal, total }) => {
            const p = state.parties.find((x) => x.id === m.partyId);
            return `<tr data-sale-row="${m.id}" style="cursor:pointer">
              <td>${m.date}</td>
              <td>${p?.name || '—'}</td>
              <td><strong>${m.blockNo}</strong><div class="s" style="color:var(--muted);font-size:.72rem">${m.choice || ''} · ${cbm(volCBM(m))} CBM</div></td>
              <td class="num">${money(total)}</td>
              <td class="num">${money(recv)}</td>
              <td class="num ${bal > 0.5 ? 'neg' : ''}">${money(bal)}</td>
              <td><span class="badge ${st.cls}">${st.label}</span></td>
              <td data-sale-actions style="white-space:nowrap">
                ${
                  bal > 0.5
                    ? `<button type="button" class="btn btn-primary btn-sm" data-sale-pay="${m.id}">Receive</button>`
                    : `<button type="button" class="btn btn-ghost btn-sm" data-sale-open="${m.id}">View</button>`
                }
              </td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="8"><div class="empty">No sales for this filter — add block markings first</div></td></tr>`;

    $$('#saleTable [data-sale-row]').forEach((tr) =>
      tr.addEventListener('click', (e) => {
        if (e.target.closest('[data-sale-actions]')) return;
        go('invoice', { saleId: tr.dataset.saleRow });
      })
    );
    $$('#saleTable [data-sale-pay]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        openReceiveSalePayment(b.dataset.salePay);
      })
    );
    $$('#saleTable [data-sale-open]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        go('invoice', { saleId: b.dataset.saleOpen });
      })
    );
  }

  function renderSalePaymentsTab() {
    ensureTxnMonthOptions('#salePayMonth', renderSale);
    const month = $('#salePayMonth')?.value || 'all';
    const q = ($('#salePaySearch')?.value || '').toLowerCase().trim();
    let rows = quarryExpenses().filter((e) => e.type === 'Credit');
    if (month !== 'all') rows = rows.filter((e) => e.date && e.date.startsWith(month));
    if (q) {
      rows = rows.filter((e) => {
        const p = e.partyId ? state.parties.find((x) => x.id === e.partyId) : null;
        const m = e.markingId ? state.markings.find((x) => x.id === e.markingId) : null;
        return `${e.particulars} ${e.head} ${p?.name || ''} ${m?.blockNo || ''}`.toLowerCase().includes(q);
      });
    }
    rows.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const total = rows.reduce((s, e) => s + (Number(e.credit) || 0), 0);
    const linked = rows.filter((e) => e.markingId).length;
    if ($('#salePayStats')) {
      $('#salePayStats').innerHTML = `
        <div class="card"><h3>Receipts</h3><div class="stat ok">${money(total)}</div></div>
        <div class="card"><h3>Entries</h3><div class="stat">${rows.length}</div></div>
        <div class="card"><h3>Linked to sale</h3><div class="stat">${linked}</div><div class="hint">Allocated payments</div></div>
        <div class="card"><h3>Other credit</h3><div class="stat">${rows.length - linked}</div><div class="hint">Not linked</div></div>`;
    }
    if ($('#salePayTable')) {
      $('#salePayTable').innerHTML = rows.length
        ? rows
            .map((e) => {
              const p = e.partyId ? state.parties.find((x) => x.id === e.partyId) : null;
              const m = e.markingId ? state.markings.find((x) => x.id === e.markingId) : null;
              return `<tr>
                <td>${e.date}</td>
                <td>${p?.name || '—'}</td>
                <td>${e.particulars}</td>
                <td>${
                  m
                    ? `<button type="button" class="btn btn-ghost btn-sm" data-open-inv="${m.id}">${m.blockNo}</button>`
                    : '<span style="color:var(--muted)">—</span>'
                }</td>
                <td class="num">${money(e.credit)}</td>
                <td><button class="icon-btn danger" data-del-ex="${e.id}" title="Delete">✕</button></td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="6"><div class="empty">No receipts</div></td></tr>`;
      $$('#salePayTable [data-del-ex]').forEach((b) =>
        b.addEventListener('click', () => deleteExpenseRow(b.dataset.delEx, renderSale))
      );
      $$('#salePayTable [data-open-inv]').forEach((b) =>
        b.addEventListener('click', () => go('invoice', { saleId: b.dataset.openInv }))
      );
    }
  }

  function renderSale() {
    $$('#saleTabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.saletab === saleTab));
    $$('.saletab').forEach((p) => {
      p.style.display = p.id === 'saletab-' + saleTab ? 'block' : 'none';
    });
    if (saleTab === 'payments') renderSalePaymentsTab();
    else renderSaleSalesTab();
  }

  function renderPurchase() {
    renderTxnBook('Debit');
  }

  function deleteExpenseRow(exId, after) {
    const ex = state.expenses.find((e) => e.id === exId);
    if (ex?.machineLedgerId) {
      state.machineLedger = (state.machineLedger || []).filter((e) => e.id !== ex.machineLedgerId);
    } else {
      state.machineLedger = (state.machineLedger || []).map((e) =>
        e.expenseId === exId ? { ...e, expenseId: null } : e
      );
    }
    state.expenses = state.expenses.filter((e) => e.id !== exId);
    save(state);
    toast('Deleted');
    after();
    renderDashboard();
  }

  function renderExpenses() {
    ensureTxnMonthOptions('#expenseMonth', renderExpenses);
    const month = $('#expenseMonth')?.value || 'all';
    const type = $('#expenseType')?.value || 'all';
    let rows = quarryExpenses();
    if (month !== 'all') rows = rows.filter((e) => e.date && e.date.startsWith(month));
    if (type !== 'all') rows = rows.filter((e) => e.type === type);
    const q = ($('#expenseSearch')?.value || '').toLowerCase().trim();
    if (q) {
      rows = rows.filter((e) => {
        const link = voucherLinkLabel(e);
        return `${e.particulars} ${e.head} ${link}`.toLowerCase().includes(q);
      });
    }
    rows.sort((a, b) => {
      const byDate = String(b.date || '').localeCompare(String(a.date || ''));
      if (byDate) return byDate;
      return state.expenses.indexOf(b) - state.expenses.indexOf(a);
    });
    const debit = rows.reduce((s, e) => s + Number(e.debit), 0);
    const credit = rows.reduce((s, e) => s + Number(e.credit), 0);
    const monthHint = month === 'all' ? 'All months' : monthLabel(month);
    if ($('#expenseStats')) {
      $('#expenseStats').innerHTML = `
      <div class="card"><h3>Debit</h3><div class="stat danger">${money(debit)}</div></div>
      <div class="card"><h3>Credit</h3><div class="stat ok">${money(credit)}</div></div>
      <div class="card"><h3>Balance</h3><div class="stat">${money(credit - debit)}</div></div>
      <div class="card"><h3>${monthHint}${type !== 'all' ? ' · ' + type : ''}</h3><div class="stat">${rows.length}</div><div class="hint">entries</div></div>`;
    }
    if ($('#expenseTable')) {
      $('#expenseTable').innerHTML = rows.length
        ? rows
            .map((e) => {
              const link = voucherLinkLabel(e);
              const typeBadge = e.type === 'Credit' ? 'ok' : e.type === 'Debit' ? 'danger' : '';
              return `<tr>
        <td>${e.date}</td>
        <td><span class="badge ${typeBadge}">${e.type}</span></td>
        <td>${e.head || '—'}</td>
        <td>${e.particulars}${link ? `<div class="s" style="color:var(--muted);font-size:.75rem">→ ${link}</div>` : ''}</td>
        <td class="num">${e.debit ? money(e.debit) : '—'}</td><td class="num">${e.credit ? money(e.credit) : '—'}</td>
        <td><button class="icon-btn danger" data-del-ex="${e.id}" title="Delete" aria-label="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button></td>
      </tr>`;
            })
            .join('')
        : `<tr><td colspan="7"><div class="empty">No entries for this filter</div></td></tr>`;
      $$('#expenseTable [data-del-ex]').forEach((b) =>
        b.addEventListener('click', () => deleteExpenseRow(b.dataset.delEx, renderExpenses))
      );
    }
  }

  function partyOptionsHtml(selectedId) {
    const sorted = [...state.parties].sort((a, b) => a.name.localeCompare(b.name));
    return (
      `<option value="">— select party —</option>` +
      sorted
        .map(
          (p) =>
            `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name} · ${partyTypeLabel(p)}</option>`
        )
        .join('') +
      `<option value="__new__">+ Add new party…</option>`
    );
  }

  const TN_STATES = [
    'Tamil Nadu',
    'Kerala',
    'Karnataka',
    'Andhra Pradesh',
    'Telangana',
    'Puducherry',
    'Other',
  ];

  function partyFormHtml() {
    return `<div class="party-form">
      <div class="party-top form-grid cols-3">
        <label class="field"><span>Party Name <em class="req">*</em></span>
          <input id="apName" placeholder="Enter party name" autofocus />
          <small class="field-error" id="apNameErr" hidden>Cannot be empty</small>
        </label>
        <label class="field"><span>GSTIN</span><input id="apGstin" placeholder="Optional" /></label>
        <label class="field"><span>Phone Number</span><input id="apPhone" type="tel" placeholder="Optional" /></label>
      </div>
      <div class="party-tabs" id="partyTabs">
        <button type="button" class="party-tab active" data-pt="gst">GST &amp; Address</button>
        <button type="button" class="party-tab" data-pt="credit">Credit &amp; Balance</button>
        <button type="button" class="party-tab" data-pt="more">Additional Fields</button>
      </div>
      <div class="party-tab-panel" id="ptab-gst">
        <div class="party-gst-grid">
          <div class="form-grid">
            <label class="field"><span>GST Type</span>
              <select id="apGstType">
                <option>Unregistered/Consumer</option>
                <option>Registered Regular</option>
                <option>Composition</option>
              </select>
            </label>
            <label class="field"><span>State</span>
              <select id="apState">
                <option value="">Select</option>
                ${TN_STATES.map((s) => `<option${s === 'Tamil Nadu' ? ' selected' : ''}>${s}</option>`).join('')}
              </select>
            </label>
            <label class="field"><span>Email ID</span><input id="apEmail" type="email" placeholder="Optional" /></label>
          </div>
          <label class="field"><span>Billing Address</span>
            <textarea id="apBilling" rows="5" placeholder="Billing Address"></textarea>
          </label>
          <div class="field">
            <span>Shipping Address</span>
            <button type="button" class="link-btn" id="apEnableShip">+ Enable Shipping Address</button>
            <textarea id="apShipping" rows="5" placeholder="Shipping Address" style="display:none;margin-top:8px"></textarea>
          </div>
        </div>
      </div>
      <div class="party-tab-panel" id="ptab-credit" style="display:none">
        <div class="form-grid cols-2">
          <label class="field"><span>Opening Balance</span><input type="number" id="apOpening" value="0" min="0" step="1" /></label>
          <label class="field"><span>As of date</span><input type="date" id="apAsOf" value="${today()}" /></label>
          <label class="field"><span>Credit Limit</span><input type="number" id="apCreditLimit" value="0" min="0" step="1" /></label>
          <label class="field"><span>Party type</span>
            <select id="apType"><option value="Customer">Customer</option><option value="Vendor">Vendor</option><option value="Both">Both</option></select>
          </label>
        </div>
      </div>
      <div class="party-tab-panel" id="ptab-more" style="display:none">
        <div class="form-grid cols-2">
          <label class="field"><span>Contact person</span><input id="apContact" placeholder="Optional" /></label>
          <label class="field"><span>Notes</span><input id="apNotes" placeholder="Optional" /></label>
        </div>
      </div>
    </div>`;
  }

  function wirePartyFormTabs() {
    $$('#partyTabs .party-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('#partyTabs .party-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        ['gst', 'credit', 'more'].forEach((k) => {
          const el = $('#ptab-' + k);
          if (el) el.style.display = tab.dataset.pt === k ? '' : 'none';
        });
      });
    });
    $('#apEnableShip')?.addEventListener('click', () => {
      const ta = $('#apShipping');
      if (!ta) return;
      ta.style.display = '';
      $('#apEnableShip').style.display = 'none';
      ta.focus();
    });
  }

  function collectPartyFromForm(existingId = null) {
    const name = ($('#apName')?.value || '').trim();
    const err = $('#apNameErr');
    if (!name) {
      if (err) err.hidden = false;
      $('#apName')?.classList.add('invalid');
      $('#apName')?.focus();
      toast('Party name required');
      return null;
    }
    if (err) err.hidden = true;
    $('#apName')?.classList.remove('invalid');
    return {
      id: existingId || uid(),
      name,
      gstin: ($('#apGstin')?.value || '').trim() || '—',
      phone: ($('#apPhone')?.value || '').trim(),
      gstType: $('#apGstType')?.value || 'Unregistered/Consumer',
      state: $('#apState')?.value || '',
      email: ($('#apEmail')?.value || '').trim(),
      billingAddress: ($('#apBilling')?.value || '').trim(),
      shippingAddress: ($('#apShipping')?.value || '').trim(),
      openingBalance: Number($('#apOpening')?.value) || 0,
      asOf: $('#apAsOf')?.value || today(),
      creditLimit: Number($('#apCreditLimit')?.value) || 0,
      type: $('#apType')?.value || 'Customer',
      contact: ($('#apContact')?.value || '').trim(),
      notes: ($('#apNotes')?.value || '').trim(),
    };
  }

  function fillPartyForm(party) {
    if (!party) return;
    if ($('#apName')) $('#apName').value = party.name || '';
    if ($('#apGstin')) $('#apGstin').value = party.gstin === '—' ? '' : party.gstin || '';
    if ($('#apPhone')) $('#apPhone').value = party.phone || '';
    if ($('#apEmail')) $('#apEmail').value = party.email || '';
    if ($('#apBilling')) $('#apBilling').value = party.billingAddress || '';
    if ($('#apShipping')) {
      $('#apShipping').value = party.shippingAddress || '';
      if (party.shippingAddress) {
        $('#apShipping').style.display = '';
        if ($('#apEnableShip')) $('#apEnableShip').style.display = 'none';
      }
    }
    if ($('#apOpening')) $('#apOpening').value = party.openingBalance || 0;
    if ($('#apCreditLimit')) $('#apCreditLimit').value = party.creditLimit || 0;
    if ($('#apAsOf')) $('#apAsOf').value = party.asOf || today();
    if ($('#apGstType') && party.gstType) $('#apGstType').value = party.gstType;
    if ($('#apState')) $('#apState').value = party.state || 'Tamil Nadu';
    if ($('#apType')) {
      const t = party.type === 'Buyer' ? 'Customer' : party.type || 'Customer';
      $('#apType').value = t;
    }
    if ($('#apContact')) $('#apContact').value = party.contact || '';
    if ($('#apNotes')) $('#apNotes').value = party.notes || '';
  }

  function clearPartyForm() {
    ['apName', 'apGstin', 'apPhone', 'apEmail', 'apBilling', 'apShipping', 'apContact', 'apNotes'].forEach((id) => {
      const el = $('#' + id);
      if (el) el.value = '';
    });
    if ($('#apOpening')) $('#apOpening').value = '0';
    if ($('#apCreditLimit')) $('#apCreditLimit').value = '0';
    if ($('#apAsOf')) $('#apAsOf').value = today();
    if ($('#apGstType')) $('#apGstType').selectedIndex = 0;
    if ($('#apState')) $('#apState').value = 'Tamil Nadu';
    if ($('#apType')) $('#apType').value = 'Customer';
    if ($('#apShipping')) $('#apShipping').style.display = 'none';
    if ($('#apEnableShip')) $('#apEnableShip').style.display = '';
    $('#apName')?.classList.remove('invalid');
    const err = $('#apNameErr');
    if (err) err.hidden = true;
    $('#apName')?.focus();
  }

  function openAddPartyModal(opts = {}) {
    const defaultType = opts.defaultType || 'Customer';
    const title = defaultType === 'Vendor' ? 'Add vendor' : 'Add customer';
    openModal(
      title,
      partyFormHtml(),
      ({ andNew }) => {
        const party = collectPartyFromForm();
        if (!party) return false;
        state.parties.push(party);
        toast((party.type === 'Vendor' ? 'Vendor' : 'Customer') + ' added · ' + party.name);
        if (andNew) {
          clearPartyForm();
          if ($('#apType')) $('#apType').value = defaultType;
          return true;
        }
        return party;
      },
      {
        large: true,
        party: true,
        saveAndNew: true,
        onAfterSave: (party) => {
          if (typeof opts.onSaved === 'function' && party && party.id) opts.onSaved(party);
          else render();
        },
      }
    );
    wirePartyFormTabs();
    if ($('#apType')) $('#apType').value = defaultType;
    $('#apName')?.addEventListener('input', () => {
      $('#apName')?.classList.remove('invalid');
      const err = $('#apNameErr');
      if (err) err.hidden = true;
    });
  }

  function openEditPartyModal(partyId) {
    const party = state.parties.find((p) => p.id === partyId);
    if (!party) return;
    const label = isVendorParty(party) && !isCustomerParty(party) ? 'vendor' : 'customer';
    openModal(
      'Edit ' + label + ' — ' + party.name,
      partyFormHtml(),
      () => {
        const next = collectPartyFromForm(party.id);
        if (!next) return false;
        Object.assign(party, next);
        toast((isVendorParty(party) ? 'Vendor' : 'Customer') + ' updated · ' + party.name);
        return party;
      },
      {
        large: true,
        party: true,
        onAfterSave: () => {
          if (isVendorParty(party) && selectedVendorId === party.id) go('vendor', { partyId: party.id });
          else if (selectedCustomerId === party.id) go('customer', { partyId: party.id });
          else render();
        },
      }
    );
    wirePartyFormTabs();
    fillPartyForm(party);
    $('#apName')?.addEventListener('input', () => {
      $('#apName')?.classList.remove('invalid');
      const err = $('#apNameErr');
      if (err) err.hidden = true;
    });
  }

  function deletePartyPerson(partyId) {
    if (!canDeleteMasters()) {
      toast('Only Owner can delete masters');
      return;
    }
    const party = state.parties.find((p) => p.id === partyId);
    if (!party) return;
    const isVendor = isVendorParty(party);
    const label = isVendor ? 'vendor' : 'customer';
    openModal(
      'Delete ' + label + ' — ' + party.name,
      `<div class="form-grid">
        <p style="margin:0;color:var(--muted);font-size:.9rem">Removes <strong>${party.name}</strong> from ${label}s. Linked bills / markings / expenses stay in books but lose this party link.</p>
        <label class="field"><span>Type DELETE to confirm</span><input id="partyDelConfirm" placeholder="DELETE" autocomplete="off" /></label>
      </div>`,
      () => {
        if (($('#partyDelConfirm')?.value || '').trim() !== 'DELETE') {
          toast('Type DELETE to confirm');
          return false;
        }
        state.parties = state.parties.filter((p) => p.id !== partyId);
        if (selectedCustomerId === partyId) selectedCustomerId = null;
        if (selectedVendorId === partyId) selectedVendorId = null;
        toast((isVendor ? 'Vendor' : 'Customer') + ' deleted · ' + party.name);
        return true;
      },
      {
        onAfterSave: () => go(isVendor ? 'vendors' : 'customers'),
      }
    );
  }

  let saleDraft = null;

  function captureSaleDraft() {
    return {
      date: $('#fDate')?.value || today(),
      amt: $('#fAmt')?.value || '',
      head: $('#fHead')?.value || 'Cash Received',
      part: $('#fPart')?.value || '',
    };
  }

  function wireSalePartyField() {
    const sel = $('#fParty');
    if (!sel) return;
    sel.addEventListener('change', () => {
      if (sel.value === '__new__') {
        saleDraft = captureSaleDraft();
        openAddPartyModal({
          onSaved: (party) => {
            openExpenseVoucher('Credit', { partyId: party.id, draft: saleDraft });
            saleDraft = null;
          },
        });
        return;
      }
      if (sel.value && !$('#fPart').value.trim()) {
        const p = state.parties.find((x) => x.id === sel.value);
        if (p) $('#fPart').value = `Received from ${p.name}`;
      }
    });
  }

  function wireDebitPartyField() {
    const sel = $('#fParty');
    if (!sel) return;
    sel.addEventListener('change', () => {
      if (sel.value === '__new__') {
        const draft = {
          date: $('#fDate')?.value || today(),
          amt: $('#fAmt')?.value || '',
          head: $('#fHead')?.value || '',
          part: $('#fPart')?.value || '',
        };
        openAddPartyModal({
          onSaved: (party) => {
            openExpenseVoucher('Debit', { partyId: party.id, draft });
          },
        });
        return;
      }
      if (sel.value && !$('#fPart').value.trim()) {
        const p = state.parties.find((x) => x.id === sel.value);
        if (p) $('#fPart').value = `Paid to ${p.name}`;
      }
    });
  }

  function openExpenseVoucher(type, opts = {}) {
    if (!canEdit()) {
      toast('View-only login');
      return;
    }
    const isCredit = type === 'Credit';
    const people = activePeopleForAdvance();
    const gangs = quarryLabourAll().sort((a, b) => a.name.localeCompare(b.name) || b.fy.localeCompare(a.fy));
    const linkOpts =
      `<option value="">— not linked —</option>` +
      `<optgroup label="Staff / Worker (salary sheet)">${people
        .map((p) => `<option value="p:${p.id}">${p.name} · ${p.category || 'Staff'}</option>`)
        .join('')}</optgroup>` +
      (gangs.length
        ? `<optgroup label="Labour gangs">${gangs
            .map((l) => `<option value="g:${l.id}">${l.name} · FY ${l.fy}</option>`)
            .join('')}</optgroup>`
        : '');
    const headOpts = state.heads
      .filter((h) => (isCredit ? h === 'Cash Received' || h === 'Other' : true))
      .map((h) => `<option${isCredit && h === 'Cash Received' ? ' selected' : ''}>${h}</option>`)
      .join('');
    const preParty = opts.partyId || '';
    const draft = opts.draft || {};
    const partyBlock = `<label class="field" style="grid-column:1/-1"><span>${
      isCredit ? 'From party' : 'Vendor / party (optional — for pending)'
    }</span>
          <select id="fParty">${partyOptionsHtml(preParty)}</select>
        </label>`;
    openModal(
      (isCredit ? 'Add credit' : 'Add debit') + ' — ' + contextLabel(),
      `<div class="form-grid cols-2">
        <label class="field"><span>Date</span><input type="date" id="fDate" value="${draft.date || today()}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="fAmt" min="0" step="1" value="${draft.amt || ''}" autofocus /></label>
        ${partyBlock}
        <label class="field" style="grid-column:1/-1"><span>Category</span>
          <select id="fHead">${headOpts.length ? headOpts : state.heads.map((h) => `<option>${h}</option>`).join('')}</select>
        </label>
        <label class="field" id="fLinkWrap" style="grid-column:1/-1;display:none">
          <span>Link to person / gang (for Salary &amp; Labour Advance)</span>
          <select id="fLink">${linkOpts}</select>
        </label>
        <label class="field" style="grid-column:1/-1"><span>Comment</span>
          <input id="fPart" value="${(draft.part || '').replace(/"/g, '&quot;')}" placeholder="${isCredit ? 'e.g. Received from party / Bulk diesel' : 'e.g. Paid to vendor / Diesel purchase'}" />
        </label>
        ${
          !isCredit
            ? `<p style="grid-column:1/-1;color:var(--muted);font-size:.82rem;margin:0">Link a <strong>Vendor</strong> on payment so it reduces that vendor’s pending under Vendor.</p>`
            : ''
        }
      </div>`,
      () => {
        const amt = Number($('#fAmt').value);
        const date = $('#fDate').value;
        let part = $('#fPart').value.trim();
        if (!amt) {
          toast('Amount required');
          return false;
        }
        const head = $('#fHead').value;
        let personId = null;
        let labourId = null;
        let partyId = null;

        if (isCredit) {
          const sel = ($('#fParty')?.value || '').trim();
          if (!sel || sel === '__new__') {
            toast('Select party (or add new party)');
            return false;
          }
          partyId = sel;
          const party = state.parties.find((x) => x.id === partyId);
          if (!part) part = party ? `Received from ${party.name}` : 'Cash received';
        } else {
          const sel = ($('#fParty')?.value || '').trim();
          if (sel && sel !== '__new__') partyId = sel;
          if (!part) {
            toast('Comment required');
            return false;
          }
        }

        if (!isCredit && isAdvanceHead(head)) {
          const link = ($('#fLink')?.value || '').trim();
          if (link.startsWith('p:')) personId = link.slice(2);
          else if (link.startsWith('g:')) labourId = link.slice(2);
          else {
            const guessed = resolveAdvanceLink(part);
            personId = guessed.personId;
            labourId = guessed.labourId;
          }
          if (!personId && !labourId) {
            toast('Select Staff/Worker or Labour gang for advances — so it shows on Salary sheet');
            return false;
          }
        }
        if (!isCredit && partyId && (head === 'Other' || !head)) {
          /* keep head; suggest Vendor Payment if linked */
        }
        if (!isCredit && partyId && head !== 'Vendor Payment' && !isAdvanceHead(head)) {
          // leave user's category; pending still updates via partyId
        }
        state.expenses.push({
          id: uid(),
          quarryId: state.activeQuarryId,
          date,
          type,
          head: !isCredit && partyId && head === 'Other' ? 'Vendor Payment' : head,
          particulars: part,
          debit: isCredit ? 0 : amt,
          credit: isCredit ? amt : 0,
          personId,
          labourId,
          partyId,
        });
        if (isCredit) toast('Credit saved · ' + (state.parties.find((x) => x.id === partyId)?.name || 'party'));
        else if (partyId) toast('Debit saved · vendor pending updated');
        else if (personId) toast('Debit saved · linked to salary sheet');
        else if (labourId) toast('Debit saved · linked to labour gang');
        else toast('Debit saved · ' + contextLabel());
        return true;
      },
      { large: true }
    );
    if (draft.head && $('#fHead')) $('#fHead').value = draft.head;
    if (preParty && $('#fParty')) $('#fParty').value = preParty;
    if (isCredit) {
      if (preParty && !$('#fPart').value.trim()) {
        const p = state.parties.find((x) => x.id === preParty);
        if (p) $('#fPart').value = `Received from ${p.name}`;
      }
      wireSalePartyField();
    } else {
      if (preParty && !$('#fPart').value.trim()) {
        const p = state.parties.find((x) => x.id === preParty);
        if (p) $('#fPart').value = `Paid to ${p.name}`;
      }
      wireAdvanceLinkField();
      wireDebitPartyField();
    }
  }

  $('#addSaleBtn')?.addEventListener('click', () => openReceiveSalePayment(selectedSaleId || null));
  $('#addSaleCreditBtn')?.addEventListener('click', () => openExpenseVoucher('Credit'));
  $('#addExpenseBtn')?.addEventListener('click', () => openExpenseVoucher('Debit'));
  $('#addAllCreditBtn')?.addEventListener('click', () => openExpenseVoucher('Credit'));
  $('#addAllDebitBtn')?.addEventListener('click', () => openExpenseVoucher('Debit'));

  $('#saleSearch')?.addEventListener('input', renderSale);
  $('#salePayFilter')?.addEventListener('change', renderSale);
  $('#salePaySearch')?.addEventListener('input', renderSale);
  $('#saleDetailPaySearch')?.addEventListener('input', renderSaleDetail);
  $('#saleDetailBack')?.addEventListener('click', () => go('sale'));
  $('#saleDetailPayBtn')?.addEventListener('click', () => {
    if (selectedSaleId) openReceiveSalePayment(selectedSaleId);
  });
  $$('#saleTabs .tab').forEach((t) =>
    t.addEventListener('click', () => {
      saleTab = t.dataset.saletab || 'sales';
      renderSale();
    })
  );
  $('#purchaseSearch')?.addEventListener('input', renderPurchase);
  $('#expenseSearch')?.addEventListener('input', renderExpenses);
  $('#expenseType')?.addEventListener('change', renderExpenses);

  /* Attendance / salary */
  function monthsInFy(fy) {
    const start = Number(fy.slice(0, 4));
    const list = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(start, 3 + i, 1);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      list.push(`${d.getFullYear()}-${mm}`);
    }
    return list;
  }

  function monthKey() {
    const sel = $('#payrollMonth') || $('#attMonth');
    return sel?.value || recentMonths(1)[0];
  }

  function recentMonths(n = 12) {
    const out = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
  }

  function monthLabel(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }

  function ensureAttMonthOptions() {
    const sel = $('#payrollMonth') || $('#attMonth');
    if (!sel) return;
    const opts = recentMonths(18);
    const cur = sel.value;
    sel.innerHTML = opts.map((v) => `<option value="${v}">${monthLabel(v)}</option>`).join('');
    if (opts.includes(cur)) sel.value = cur;
    else sel.value = opts[0];
    if (!sel.dataset.bound) {
      sel.dataset.bound = '1';
      sel.addEventListener('change', renderPayroll);
    }
  }

  function getAtt(staffId, day, ym = monthKey()) {
    const key = `${state.activeQuarryId}|${ym}|${staffId}`;
    const map = state.attendance[key] || {};
    return map[String(day)] || 'X';
  }

  function setAtt(staffId, day, val, ym = monthKey()) {
    const key = `${state.activeQuarryId}|${ym}|${staffId}`;
    if (!state.attendance[key]) state.attendance[key] = {};
    state.attendance[key][String(day)] = val;
  }

  /** Attendance mark: X/A/H/L or O:hours (plain O → 8h for old data). */
  function parseAtt(v) {
    if (!v || v === 'X') return { mark: 'X', otHours: 0 };
    if (v === 'O') return { mark: 'O', otHours: 8 };
    if (typeof v === 'string' && v.startsWith('O:')) {
      const h = Number(v.slice(2));
      return { mark: 'O', otHours: Number.isFinite(h) && h > 0 ? h : 8 };
    }
    if (v === 'A' || v === 'H' || v === 'L') return { mark: v, otHours: 0 };
    return { mark: 'X', otHours: 0 };
  }

  function formatOtMark(hours) {
    const h = Number(hours);
    return `O:${Number.isFinite(h) && h > 0 ? h : 8}`;
  }

  function attLabel(v) {
    const p = parseAtt(v);
    if (p.mark === 'O') {
      const h = p.otHours;
      return Number.isInteger(h) ? `${h}h` : `${h}h`;
    }
    return p.mark;
  }

  function attCss(v) {
    return parseAtt(v).mark;
  }

  function presentDays(staffId) {
    return attendanceStats(staffId).days;
  }

  function attendanceStats(staffId, ym = monthKey()) {
    const dim = daysInMonth(ym);
    let days = 0;
    let ot = 0;
    let leave = 0;
    const marks = {};
    for (let d = 1; d <= dim; d++) {
      const v = getAtt(staffId, d, ym);
      const p = parseAtt(v);
      marks[d] = v;
      if (p.mark === 'X') days += 1;
      else if (p.mark === 'H') days += 0.5;
      else if (p.mark === 'L') {
        days += 1;
        leave += 1;
      } else if (p.mark === 'O') {
        days += 1;
        ot += p.otHours;
      }
    }
    return { days, ot, leave, marks, dim };
  }

  function dayRateOf(p, dim) {
    if ((p.category || 'Staff') === 'Worker' || (p.dailyRate && !p.basic)) {
      return Number(p.dailyRate || 0);
    }
    return Number(p.basic || 0) / (dim || 30);
  }

  function hourRateOf(p, dim) {
    return dayRateOf(p, dim) / 8;
  }

  function downloadCsv(filename, rows) {
    const bom = '\uFEFF';
    const csv = rows
      .map((r) =>
        r
          .map((c) => {
            const s = String(c ?? '');
            return `"${s.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bom + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function printReport(title, bodyHtml) {
    const w = window.open('', '_blank');
    if (!w) {
      toast('Allow pop-ups to print PDF');
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#1e2933}
        h1{font-size:1.2rem;margin:0 0 4px} .meta{color:#667787;font-size:.85rem;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:.82rem}
        th,td{border:1px solid #d5dde5;padding:6px 8px;text-align:left}
        th{background:#f4f6f8} .num{text-align:right}
        @media print{button{display:none}}
      </style></head><body>
      <h1>${title}</h1>
      <div class="meta">${activeQuarry().name} · printed ${today()}</div>
      ${bodyHtml}
      <p style="margin-top:16px"><button onclick="print()">Print / Save as PDF</button></p>
      <script>setTimeout(()=>print(),250)</script>
      </body></html>`);
    w.document.close();
  }

  const tableUI = {
    salary: { page: 1 },
    people: { page: 1 },
    advances: { page: 1 },
    staffmgmt: { page: 1 },
    staffsalary: { page: 1 },
    staffadvances: { page: 1 },
    customers: { page: 1 },
    vendors: { page: 1 },
    invoices: { page: 1 },
  };

  function slicePage(list, key, pageSizeSel) {
    const size = Number($(pageSizeSel)?.value || 10);
    const pages = Math.max(1, Math.ceil(list.length / size) || 1);
    if (tableUI[key].page > pages) tableUI[key].page = pages;
    if (tableUI[key].page < 1) tableUI[key].page = 1;
    const start = (tableUI[key].page - 1) * size;
    return {
      rows: list.slice(start, start + size),
      total: list.length,
      page: tableUI[key].page,
      pages,
      size,
    };
  }

  function renderPager(el, key, pageInfo, rerender) {
    if (!el) return;
    el.innerHTML = `
      <span>${pageInfo.total} rows · page ${pageInfo.page}/${pageInfo.pages}</span>
      <div class="pager-btns">
        <button type="button" class="btn btn-ghost btn-sm" data-pg="prev" ${pageInfo.page <= 1 ? 'disabled' : ''}>Prev</button>
        <button type="button" class="btn btn-ghost btn-sm" data-pg="next" ${pageInfo.page >= pageInfo.pages ? 'disabled' : ''}>Next</button>
      </div>`;
    el.querySelector('[data-pg="prev"]')?.addEventListener('click', () => {
      tableUI[key].page -= 1;
      rerender();
    });
    el.querySelector('[data-pg="next"]')?.addEventListener('click', () => {
      tableUI[key].page += 1;
      rerender();
    });
  }

  function bankLabel(p) {
    if (!p.bankAc && !p.bankName) return '—';
    return `${p.bankName || 'Bank'} · ${p.bankAc || '—'}${p.ifsc ? `<div class="s" style="color:var(--muted);font-size:.72rem">${p.ifsc}</div>` : ''}`;
  }

  function isAdvanceHead(head) {
    return head === 'Salary Advance' || head === 'Labour Advance';
  }

  function activePeopleForAdvance() {
    return state.staff
      .filter((p) => p.quarryId === state.activeQuarryId && !p.exitDate)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function particularsMatchPerson(particulars, personName) {
    if (!particulars || !personName) return false;
    const part = particulars.toLowerCase();
    const name = personName.toLowerCase().trim();
    if (part.includes(name)) return true;
    const tokens = name.split(/\s+/).filter((t) => t.length > 2 && !/^(op|poc|a\/c)$/i.test(t));
    return tokens.some((t) => part.includes(t));
  }

  function labourNameMatch(particulars, labourName) {
    if (!particulars || !labourName) return false;
    if (particularsMatchPerson(particulars, labourName)) return true;
    const part = particulars.toLowerCase();
    const key = labourName.toLowerCase().replace(/\s*labour.*$/i, '').trim();
    if (!key) return false;
    if (key === 'pullu' && /pull+u/.test(part)) return true;
    if (key === 'pancha' && part.includes('pancha')) return true;
    if (key === 'orissa' && part.includes('orissa')) return true;
    return part.includes(key);
  }

  function resolveAdvanceLink(particulars) {
    const people = state.staff.filter((p) => p.quarryId === state.activeQuarryId);
    const hit = people.find((p) => particularsMatchPerson(particulars, p.name));
    if (hit) return { personId: hit.id, labourId: null };
    const gang = quarryLabourAll().find((l) => labourNameMatch(particulars, l.name));
    if (gang) return { personId: null, labourId: gang.id };
    return { personId: null, labourId: null };
  }

  function personAdvances(personId, personName, ym) {
    return quarryExpenses().filter((e) => {
      if (!isAdvanceHead(e.head)) return false;
      if (Number(e.debit) <= 0) return false;
      if (ym && e.date && !e.date.startsWith(ym)) return false;
      if (e.labourId) return false;
      if (e.personId) return e.personId === personId;
      if (e.head === 'Labour Advance') {
        const gangHit = quarryLabourAll().some((l) => labourNameMatch(e.particulars, l.name));
        if (gangHit) return false;
      }
      return particularsMatchPerson(e.particulars, personName);
    });
  }

  function labourAdvances(labourId, labourName, fy = null) {
    return quarryExpenses().filter((e) => {
      if (e.head !== 'Labour Advance') return false;
      if (Number(e.debit) <= 0) return false;
      if (fy && e.date && !inFy(e.date, fy)) return false;
      if (e.personId) return false;
      if (e.labourId) return e.labourId === labourId;
      return labourNameMatch(e.particulars, labourName);
    });
  }

  function labourAdvanceTotal(labourId, labourName, fy = null) {
    return labourAdvances(labourId, labourName, fy).reduce((a, e) => a + Number(e.debit), 0);
  }

  function labourWageVouchers(labourId, labourName, fy = null) {
    return quarryExpenses().filter((e) => {
      if (e.head !== 'Labour Wage') return false;
      if (Number(e.debit) <= 0) return false;
      if (fy && e.date && !inFy(e.date, fy)) return false;
      if (e.personId) return false;
      if (e.labourId) return e.labourId === labourId;
      return labourNameMatch(e.particulars, labourName);
    });
  }

  function labourWageTotal(labourId, labourName, fy = null) {
    return labourWageVouchers(labourId, labourName, fy).reduce((a, e) => a + Number(e.debit), 0);
  }

  function labourTxnRows(labourId, labourName, fy = null) {
    const rows = [];
    labourAdvances(labourId, labourName, fy).forEach((e) => {
      rows.push({
        type: 'Advance',
        date: e.date || '',
        particulars: e.particulars || '—',
        amount: Number(e.debit) || 0,
      });
    });
    labourWageVouchers(labourId, labourName, fy).forEach((e) => {
      rows.push({
        type: 'Payment',
        date: e.date || '',
        particulars: e.particulars || '—',
        amount: Number(e.debit) || 0,
      });
    });
    return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  function labourWage(l) {
    return (
      Number(l.days || 0) * Number(l.dayRate || 0) +
      Number(l.otNight || 0) * Number(l.otNightRate || 0) +
      Number(l.otHours || 0) * Number(l.otHourRate || 0) +
      Number(l.mastiri || 0)
    );
  }

  function labourTotals(l) {
    const wage = labourWage(l);
    const opening = Number(l.openingAdvance || 0);
    const cash = labourAdvanceTotal(l.id, l.name, l.fy);
    const adv = opening + cash;
    return { wage, opening, cash, adv, pending: wage - adv };
  }

  function labourForMonth(ym = monthKey()) {
    const fy = fyFromDate(ym + '-01');
    return quarryLabourAll()
      .filter((l) => l.fy === fy)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function labAttKey(labourId, ym = monthKey()) {
    return `${state.activeQuarryId}|${ym}|${labourId}`;
  }

  function getLabAtt(labourId, day, ym = monthKey()) {
    const map = (state.labourAttendance || {})[labAttKey(labourId, ym)] || {};
    const v = map[String(day)];
    if (v == null) return { n: 0, ot: 0, night: 0 };
    if (typeof v === 'number') return { n: Number(v) || 0, ot: 0, night: 0 };
    return { n: Number(v.n || 0), ot: Number(v.ot || 0), night: Number(v.night || 0) };
  }

  function setLabAtt(labourId, day, n, ot = 0, ym = monthKey(), night = 0) {
    if (!state.labourAttendance) state.labourAttendance = {};
    const key = labAttKey(labourId, ym);
    if (!state.labourAttendance[key]) state.labourAttendance[key] = {};
    const nn = Number(n) || 0;
    const oo = Number(ot) || 0;
    const ng = Number(night) || 0;
    if (nn <= 0 && oo <= 0 && ng <= 0) delete state.labourAttendance[key][String(day)];
    else state.labourAttendance[key][String(day)] = { n: nn, ot: oo, night: ng };
  }

  function labAttLabel(cur) {
    const n = Number(cur?.n || 0);
    const ot = Number(cur?.ot || 0);
    const night = Number(cur?.night || 0);
    if (!n && !ot && !night) return '·';
    let s = String(n || 0);
    if (night) s += `+${night}N`;
    if (ot) s += `+${ot}h`;
    return s;
  }

  function labAttActive(cur) {
    return Number(cur?.n || 0) > 0 || Number(cur?.ot || 0) > 0 || Number(cur?.night || 0) > 0;
  }

  function labourMonthStats(labourId, ym = monthKey()) {
    const dim = daysInMonth(ym);
    let manDays = 0;
    let ot = 0;
    let night = 0;
    let workDays = 0;
    for (let d = 1; d <= dim; d++) {
      const cur = getLabAtt(labourId, d, ym);
      if (labAttActive(cur)) workDays += 1;
      manDays += cur.n;
      ot += cur.ot;
      night += cur.night;
    }
    return { manDays, ot, night, workDays, dim };
  }

  function labourMonthAdvance(labourId, labourName, ym = monthKey()) {
    return labourAdvances(labourId, labourName).filter((e) => e.date && e.date.startsWith(ym)).reduce((a, e) => a + Number(e.debit), 0);
  }

  function salaryPaymentForLabour(labourId, ym = monthKey()) {
    return (state.salaryPayments || []).find(
      (p) => p.labourId === labourId && p.ym === ym && p.quarryId === state.activeQuarryId
    );
  }

  function labourSalaryRow(l, ym = monthKey()) {
    const st = labourMonthStats(l.id, ym);
    const dayRate = Number(l.dayRate || 0);
    const hourRate = Number(l.otHourRate || 0) || dayRate / 8;
    const nightRate = Number(l.otNightRate || dayRate || 0);
    const earned =
      st.manDays * dayRate + st.ot * hourRate + st.night * nightRate;
    const adv = labourMonthAdvance(l.id, l.name, ym);
    const net = Math.max(0, Math.round(earned - adv));
    const paid = salaryPaymentForLabour(l.id, ym);
    return {
      days: st.manDays,
      ot: st.ot,
      night: st.night,
      workDays: st.workDays,
      earned,
      adv,
      net,
      paid,
      kind: 'labour',
    };
  }

  function openLabDayModal(labourId, day, ym = monthKey()) {
    const l = state.labour.find((x) => x.id === labourId);
    if (!l) return;
    const cur = getLabAtt(labourId, day, ym);
    openModal(
      `${l.name} · ${monthLabel(ym)} · day ${day}`,
      `<div class="form-grid cols-2">
        <p style="grid-column:1/-1;color:var(--muted);font-size:.9rem;margin:0">Contract gang — day headcount, night shift headcount, and OT hours. Night paid at night rate (${money(l.otNightRate || l.dayRate)}).</p>
        <label class="field"><span>Day headcount</span><input type="number" id="labN" min="0" step="0.5" value="${cur.n || ''}" placeholder="e.g. 12" /></label>
        <label class="field"><span>Night shift</span><input type="number" id="labNight" min="0" step="0.5" value="${cur.night || ''}" placeholder="e.g. 4" /></label>
        <label class="field" style="grid-column:1/-1"><span>OT hours (gang total)</span><input type="number" id="labOt" min="0" step="0.5" value="${cur.ot || ''}" placeholder="e.g. 4" /></label>
        <button type="button" class="btn btn-ghost btn-sm" id="labClearDay" style="grid-column:1/-1">Clear day (0)</button>
      </div>`,
      () => {
        const n = Number($('#labN').value) || 0;
        const night = Number($('#labNight').value) || 0;
        const ot = Number($('#labOt').value) || 0;
        setLabAtt(labourId, day, n, ot, ym, night);
        toast(`${l.name} · day ${day} · ${n} day · ${night} night · ${ot}h OT`);
        return true;
      }
    );
    $('#labClearDay')?.addEventListener('click', () => {
      setLabAtt(labourId, day, 0, 0, ym, 0);
      save(state);
      $('#modal').classList.remove('open');
      toast('Cleared');
      render();
    });
    setTimeout(() => $('#labN')?.focus(), 50);
  }

  function postLabourPayment(l, ym, opts = {}) {
    const row = labourSalaryRow(l, ym);
    if (row.paid) return { ok: false, msg: 'Already paid' };
    if (row.net <= 0) return { ok: false, msg: 'Net is ₹0' };
    const date = opts.date || today();
    const modeLabel = opts.mode || 'Cash';
    const payId = uid();
    state.salaryPayments.push({
      id: payId,
      quarryId: state.activeQuarryId,
      labourId: l.id,
      ym,
      date,
      mode: modeLabel,
      amount: row.net,
      earned: row.earned,
      advance: row.adv,
      days: row.days,
      note: opts.note || '',
    });
    state.expenses.push({
      id: uid(),
      quarryId: state.activeQuarryId,
      date,
      type: 'Debit',
      head: 'Labour Wage',
      particulars: opts.note || `${l.name} Wage ${ym} (${modeLabel})`,
      debit: row.net,
      credit: 0,
      labourId: l.id,
      salaryPaymentId: payId,
      mode: modeLabel,
    });
    return { ok: true, amount: row.net };
  }

  function openPayLabour(labourId, payYm = null) {
    const l = state.labour.find((x) => x.id === labourId);
    if (!l) return;
    const ym = payYm || monthKey();
    const row = labourSalaryRow(l, ym);
    if (row.paid) {
      toast('Already paid on ' + row.paid.date);
      return;
    }
    if (row.net <= 0) {
      toast('Net is ₹0 — mark attendance / check advances');
      return;
    }
    openModal(
      'Pay labour gang — ' + l.name,
      `<div class="form-grid cols-2">
        <p style="grid-column:1/-1;color:var(--muted);font-size:.9rem;margin:0">
          ${monthLabel(ym)} · Day ${row.days} · Night ${row.night || 0} · OT ${row.ot}h · Earned ${money(row.earned)} − Adv ${money(row.adv)} =
          <strong style="color:var(--text)">${money(row.net)}</strong>
        </p>
        <label class="field"><span>Pay date</span><input type="date" id="labPayDate" value="${today()}" /></label>
        <label class="field"><span>Mode</span>
          <select id="labPayMode"><option value="Cash">Cash</option><option value="Bank">Bank transfer</option></select>
        </label>
        <label class="field" style="grid-column:1/-1"><span>Note</span><input id="labPayNote" placeholder="optional" /></label>
      </div>`,
      () => {
        const r = postLabourPayment(l, ym, {
          date: $('#labPayDate').value || today(),
          mode: $('#labPayMode').value,
          note: ($('#labPayNote').value || '').trim(),
        });
        if (!r.ok) {
          toast(r.msg);
          return false;
        }
        toast('Paid ' + money(r.amount) + ' → ' + l.name);
        return true;
      }
    );
  }

  function reverseLabourPayment(labourId) {
    const ym = monthKey();
    const pay = salaryPaymentForLabour(labourId, ym);
    if (!pay) {
      toast('No payment to undo');
      return;
    }
    if (!confirm(`Undo labour pay for ${ym}? Removes Labour Wage voucher too.`)) return;
    state.salaryPayments = (state.salaryPayments || []).filter((p) => p.id !== pay.id);
    state.expenses = state.expenses.filter((e) => e.salaryPaymentId !== pay.id);
    save(state);
    toast('Labour payment reversed');
    renderPayroll();
  }

  function wireAdvanceLinkField() {
    const head = $('#fHead');
    const wrap = $('#fLinkWrap');
    if (!head || !wrap) return;
    const toggle = () => {
      wrap.style.display = isAdvanceHead(head.value) ? '' : 'none';
    };
    head.addEventListener('change', toggle);
    toggle();
  }

  function advanceTotal(personId, personName, ym) {
    return personAdvances(personId, personName, ym).reduce((a, e) => a + Number(e.debit), 0);
  }

  function salaryPaymentFor(personId, ym) {
    return (state.salaryPayments || []).find(
      (p) => p.personId === personId && p.ym === ym && p.quarryId === state.activeQuarryId
    );
  }

  function salaryRow(s, ym, dim) {
    const stats = attendanceStats(s.id, ym);
    const earned = earnForMonth(s, stats.days, dim, stats.ot);
    const adv = advanceTotal(s.id, s.name, ym);
    const net = Math.max(0, Math.round(earned - adv));
    const paid = salaryPaymentFor(s.id, ym);
    return { days: stats.days, ot: stats.ot, leave: stats.leave, earned, adv, net, paid };
  }

  function reverseSalaryPayment(personId, ymOverride) {
    const ym = ymOverride || monthKey();
    const pay = salaryPaymentFor(personId, ym);
    if (!pay) {
      toast('No payment to undo');
      return;
    }
    if (!confirm(`Undo salary pay for ${ym}? Removes All Transactions salary voucher too.`)) return;
    state.salaryPayments = (state.salaryPayments || []).filter((p) => p.id !== pay.id);
    state.expenses = state.expenses.filter((e) => e.salaryPaymentId !== pay.id);
    save(state);
    toast('Payment reversed');
    render();
  }

  function exportAttendanceExcel() {
    const ym = monthKey();
    const dim = daysInMonth(ym);
    const people = peopleForMonth(ym, $('#attCategory')?.value || 'all');
    const head = ['Name', 'Type', 'Designation', ...Array.from({ length: dim }, (_, i) => String(i + 1)), 'Days', 'OT hrs', 'Leave'];
    const rows = [head];
    people.forEach((s) => {
      const st = attendanceStats(s.id, ym);
      rows.push([
        s.name,
        s.category || 'Staff',
        s.designation || '',
        ...Array.from({ length: dim }, (_, i) => attLabel(st.marks[i + 1] || 'X')),
        st.days,
        st.ot,
        st.leave,
      ]);
    });
    downloadCsv(`attendance-${activeQuarry().code}-${ym}.csv`, rows);
    toast('Attendance Excel downloaded');
  }

  function exportAttendancePdf() {
    const ym = monthKey();
    const dim = daysInMonth(ym);
    const people = peopleForMonth(ym, $('#attCategory')?.value || 'all');
    let th = '<th>Name</th>';
    for (let d = 1; d <= dim; d++) th += `<th>${d}</th>`;
    th += '<th>Days</th><th>OT hrs</th>';
    const body = people
      .map((s) => {
        const st = attendanceStats(s.id, ym);
        let cells = `<td>${s.name}</td>`;
        for (let d = 1; d <= dim; d++) cells += `<td>${attLabel(st.marks[d] || 'X')}</td>`;
        cells += `<td class="num">${st.days}</td><td class="num">${st.ot}</td>`;
        return `<tr>${cells}</tr>`;
      })
      .join('');
    printReport(`Attendance · ${monthLabel(ym)}`, `<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`);
  }

  function exportSalaryExcel() {
    const ym = monthKey();
    const dim = daysInMonth(ym);
    const rows = [['Name', 'Type', 'Designation', 'Bank', 'A/c', 'IFSC', 'Rate', 'Days', 'OT hrs', 'Earned', 'Advance', 'Net', 'Status', 'Paid date', 'Mode']];
    peopleForMonth(ym, 'all').forEach((s) => {
      const r = salaryRow(s, ym, dim);
      rows.push([
        s.name,
        s.category || 'Staff',
        s.designation || '',
        s.bankName || '',
        s.bankAc || '',
        s.ifsc || '',
        rateLabel(s),
        r.days,
        r.ot,
        Math.round(r.earned),
        r.adv,
        r.net,
        r.paid ? 'Paid' : 'Unpaid',
        r.paid?.date || '',
        r.paid?.mode || '',
      ]);
    });
    downloadCsv(`salary-${activeQuarry().code}-${ym}.csv`, rows);
    toast('Salary Excel downloaded');
  }

  function exportSalaryPdf() {
    const ym = monthKey();
    const dim = daysInMonth(ym);
    const body = peopleForMonth(ym, 'all')
      .map((s) => {
        const r = salaryRow(s, ym, dim);
        return `<tr>
          <td>${s.name}</td><td>${s.category || 'Staff'}</td><td>${s.designation || ''}</td>
          <td>${s.bankAc || '—'}</td><td class="num">${r.days}</td><td class="num">${r.ot ? r.ot + 'h' : '—'}</td>
          <td class="num">${money(r.earned)}</td><td class="num">${money(r.adv)}</td>
          <td class="num">${money(r.net)}</td><td>${r.paid ? 'Paid ' + r.paid.mode : 'Unpaid'}</td>
        </tr>`;
      })
      .join('');
    printReport(
      `Salary sheet · ${monthLabel(ym)}`,
      `<table><thead><tr>
        <th>Name</th><th>Type</th><th>Desig.</th><th>Bank A/c</th><th>Days</th><th>OT hrs</th>
        <th>Earned</th><th>Adv</th><th>Net</th><th>Status</th>
      </tr></thead><tbody>${body}</tbody></table>`
    );
  }

  function openEditPerson(personId) {
    const p = state.staff.find((x) => x.id === personId);
    if (!p) return;
    const esc = (s) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
    openModal(
      'Edit person — ' + p.name,
      `<div class="form-grid cols-2">
        <label class="field"><span>Name</span><input id="eName" value="${esc(p.name)}" /></label>
        <label class="field"><span>Category</span>
          <select id="eCat">
            <option value="Staff" ${p.category !== 'Worker' ? 'selected' : ''}>Staff (monthly)</option>
            <option value="Worker" ${p.category === 'Worker' ? 'selected' : ''}>Worker (daily)</option>
          </select>
        </label>
        <label class="field"><span>Designation</span><input id="eDesig" value="${esc(p.designation || '')}" /></label>
        <label class="field"><span>Join date</span><input type="date" id="eJoin" value="${esc(p.joinDate || '')}" /></label>
        <label class="field"><span>Monthly basic (Staff)</span><input type="number" id="eBasic" value="${p.basic || 0}" /></label>
        <label class="field"><span>Daily rate (Worker)</span><input type="number" id="eDaily" value="${p.dailyRate || 0}" /></label>
        <label class="field"><span>Bank name</span><input id="eBank" value="${esc(p.bankName || '')}" placeholder="CUB / TMB Melur" /></label>
        <label class="field"><span>A/c number</span><input id="eAc" value="${esc(p.bankAc || '')}" /></label>
        <label class="field" style="grid-column:1/-1"><span>IFSC</span><input id="eIfsc" value="${esc(p.ifsc || '')}" /></label>
      </div>`,
      () => {
        const name = $('#eName').value.trim();
        if (!name) {
          toast('Name required');
          return false;
        }
        const cat = $('#eCat').value;
        p.name = name;
        p.category = cat;
        p.designation = $('#eDesig').value.trim();
        p.joinDate = $('#eJoin').value || p.joinDate;
        p.basic = cat === 'Staff' ? Number($('#eBasic').value) || 0 : 0;
        p.dailyRate = cat === 'Worker' ? Number($('#eDaily').value) || 0 : 0;
        p.bankName = $('#eBank').value.trim();
        p.bankAc = $('#eAc').value.trim();
        p.ifsc = $('#eIfsc').value.trim();
        toast('Updated · ' + name);
        return true;
      }
    );
  }

  function postSalaryPayment(s, ym, dim, { date, mode, note }) {
    const row = salaryRow(s, ym, dim);
    if (row.paid) return { ok: false, msg: s.name + ' already paid for ' + ym };
    if (row.net <= 0) return { ok: false, msg: s.name + ' — nothing to pay (net ₹0)' };
    const payId = uid();
    const modeLabel = mode === 'Bank' ? 'Bank' : 'Cash';
    state.salaryPayments.push({
      id: payId,
      quarryId: state.activeQuarryId,
      personId: s.id,
      ym,
      date,
      mode: modeLabel,
      amount: row.net,
      earned: row.earned,
      advance: row.adv,
      days: row.days,
      note: note || '',
    });
    state.expenses.push({
      id: uid(),
      quarryId: state.activeQuarryId,
      date,
      type: 'Debit',
      head: 'Salary',
      particulars: note || `${s.name} Salary ${ym} (${modeLabel})`,
      debit: row.net,
      credit: 0,
      personId: s.id,
      salaryPaymentId: payId,
      mode: modeLabel,
    });
    return { ok: true, amount: row.net };
  }

  function openPaySalary(personId, ymOverride) {
    const s = state.staff.find((x) => x.id === personId);
    if (!s) return;
    const ym = ymOverride || monthKey();
    const dim = daysInMonth(ym);
    const row = salaryRow(s, ym, dim);
    if (row.paid) {
      toast('Already paid on ' + row.paid.date + ' via ' + row.paid.mode);
      return;
    }
    if (row.net <= 0) {
      toast('Net is ₹0 — nothing to mark paid');
      return;
    }
    openModal(
      'Pay salary — ' + s.name,
      `<div class="form-grid cols-2">
        <p style="grid-column:1/-1;color:var(--muted);font-size:.9rem;margin:0">
          ${ym} · Days ${row.days} · Earned ${money(row.earned)} − Adv ${money(row.adv)} =
          <strong style="color:var(--text)">${money(row.net)}</strong>
        </p>
        <label class="field"><span>Pay date</span><input type="date" id="salPayDate" value="${today()}" /></label>
        <label class="field"><span>Mode</span>
          <select id="salPayMode"><option value="Cash">Cash</option><option value="Bank">Bank transfer</option></select>
        </label>
        <label class="field" style="grid-column:1/-1"><span>Note</span>
          <input id="salPayNote" placeholder="optional — week 1 / CUB Melur" />
        </label>
      </div>`,
      () => {
        const r = postSalaryPayment(s, ym, dim, {
          date: $('#salPayDate').value || today(),
          mode: $('#salPayMode').value,
          note: ($('#salPayNote').value || '').trim(),
        });
        if (!r.ok) {
          toast(r.msg);
          return false;
        }
        toast('Paid ' + money(r.amount) + ' → ' + s.name);
        return true;
      }
    );
  }

  function openPayBatch(people, title, ymOverride) {
    const ym = ymOverride || monthKey();
    const dim = daysInMonth(ym);
    const unpaid = people.filter((s) => {
      const row = salaryRow(s, ym, dim);
      return !row.paid && row.net > 0;
    });
    if (!unpaid.length) {
      toast('No unpaid salaries in selection');
      return;
    }
    const total = unpaid.reduce((a, s) => a + salaryRow(s, ym, dim).net, 0);
    openModal(
      title + ' — ' + ym,
      `<div class="form-grid cols-2">
        <p style="grid-column:1/-1;color:var(--muted);font-size:.9rem;margin:0">
          ${unpaid.length} people · total <strong style="color:var(--text)">${money(total)}</strong>
        </p>
        <label class="field"><span>Pay date</span><input type="date" id="salPayDate" value="${today()}" /></label>
        <label class="field"><span>Mode</span>
          <select id="salPayMode"><option value="Cash">Cash</option><option value="Bank">Bank transfer</option></select>
        </label>
      </div>`,
      () => {
        const date = $('#salPayDate').value || today();
        const mode = $('#salPayMode').value;
        let n = 0;
        let amt = 0;
        unpaid.forEach((s) => {
          const r = postSalaryPayment(s, ym, dim, { date, mode, note: '' });
          if (r.ok) {
            n++;
            amt += r.amount;
          }
        });
        toast(`Paid ${n} people · ${money(amt)}`);
        return true;
      }
    );
  }

  function openPayAllSalary() {
    const ym = monthKey();
    openPayMixedBatch('Pay all unpaid');
  }

  function selectedSalaryTargets() {
    return $$('#salaryTable input.sal-check:checked')
      .map((c) => {
        const raw = String(c.value);
        if (raw.startsWith('labour:')) {
          const l = state.labour.find((x) => x.id === raw.slice(7));
          return l ? { kind: 'labour', l } : null;
        }
        const pid = raw.startsWith('person:') ? raw.slice(7) : raw;
        const s = state.staff.find((x) => x.id === pid);
        return s ? { kind: 'person', s } : null;
      })
      .filter(Boolean);
  }

  function syncSalarySelectUI() {
    const boxes = $$('#salaryTable input.sal-check');
    const checked = boxes.filter((c) => c.checked);
    const btn = $('#paySelectedSalaryBtn');
    if (btn) {
      btn.disabled = !checked.length;
      btn.textContent = checked.length ? `Pay selected (${checked.length})` : 'Pay selected';
    }
    const all = $('#salSelectAll');
    if (all) {
      all.checked = boxes.length > 0 && checked.length === boxes.length;
      all.indeterminate = checked.length > 0 && checked.length < boxes.length;
    }
  }

  function openPayMixedBatch(title, onlyTargets = null) {
    const ym = monthKey();
    const dim = daysInMonth(ym);
    let targets = onlyTargets;
    if (!targets) {
      targets = [
        ...peopleForMonth(ym, 'all')
          .map((s) => ({ kind: 'person', s, row: salaryRow(s, ym, dim) }))
          .filter((t) => !t.row.paid && t.row.net > 0),
        ...labourForMonth(ym)
          .map((l) => ({ kind: 'labour', l, row: labourSalaryRow(l, ym) }))
          .filter((t) => !t.row.paid && t.row.net > 0),
      ];
    } else {
      targets = targets
        .map((t) =>
          t.kind === 'labour'
            ? { ...t, row: labourSalaryRow(t.l, ym) }
            : { ...t, row: salaryRow(t.s, ym, dim) }
        )
        .filter((t) => !t.row.paid && t.row.net > 0);
    }
    if (!targets.length) {
      toast('Nothing unpaid with net > 0');
      return;
    }
    const total = targets.reduce((s, t) => s + t.row.net, 0);
    openModal(
      title + ' — ' + monthLabel(ym),
      `<div class="form-grid cols-2">
        <p style="grid-column:1/-1;color:var(--muted);font-size:.9rem;margin:0">
          ${targets.length} rows (staff/worker/gangs) · total <strong style="color:var(--text)">${money(total)}</strong>
        </p>
        <label class="field"><span>Pay date</span><input type="date" id="salPayDate" value="${today()}" /></label>
        <label class="field"><span>Mode</span>
          <select id="salPayMode"><option value="Cash">Cash</option><option value="Bank">Bank transfer</option></select>
        </label>
      </div>`,
      () => {
        const date = $('#salPayDate').value || today();
        const mode = $('#salPayMode').value;
        let n = 0;
        let amt = 0;
        targets.forEach((t) => {
          const r =
            t.kind === 'labour'
              ? postLabourPayment(t.l, ym, { date, mode, note: '' })
              : postSalaryPayment(t.s, ym, dim, { date, mode, note: '' });
          if (r.ok) {
            n++;
            amt += r.amount;
          }
        });
        toast(`Paid ${n} · ${money(amt)}`);
        return true;
      }
    );
  }

  function openPaySelectedSalary() {
    const targets = selectedSalaryTargets();
    if (!targets.length) {
      toast('Select unpaid rows');
      return;
    }
    openPayMixedBatch('Pay selected', targets);
  }

  function renderAdvanceTable() {
    const ym = monthKey();
    const q = ($('#advSearch')?.value || '').toLowerCase().trim();
    const sort = $('#advSort')?.value || 'date-desc';
    let list = quarryExpenses()
      .filter((e) => isAdvanceHead(e.head) && Number(e.debit) > 0)
      .filter((e) => e.date && e.date.startsWith(ym))
      .map((e) => {
        let p = e.personId ? state.staff.find((x) => x.id === e.personId) : null;
        let g = e.labourId ? state.labour.find((x) => x.id === e.labourId) : null;
        if (!p && !g) {
          const guessed = resolveAdvanceLink(e.particulars);
          if (guessed.personId) p = state.staff.find((x) => x.id === guessed.personId);
          if (guessed.labourId) g = state.labour.find((x) => x.id === guessed.labourId);
        }
        const name = p?.name || g?.name || '—';
        const type = p ? p.category || 'Staff' : g ? 'Gang' : e.head === 'Labour Advance' ? 'Gang?' : '—';
        return { e, p, g, name, type };
      });
    if (q) {
      list = list.filter((row) =>
        `${row.name} ${row.e.particulars} ${row.e.head}`.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sort === 'date-asc') return a.e.date.localeCompare(b.e.date);
      if (sort === 'amt-desc') return Number(b.e.debit) - Number(a.e.debit);
      if (sort === 'name') return a.name.localeCompare(b.name);
      return b.e.date.localeCompare(a.e.date);
    });
    const page = slicePage(list, 'advances', '#advPageSize');
    $('#advanceTable').innerHTML = page.rows.length
      ? page.rows
          .map((row) => {
            const linked = row.p || row.g ? '' : ' <span class="badge warn">unlinked</span>';
            return `<tr>
              <td>${row.e.date}</td>
              <td><strong>${row.name}</strong>${linked}</td>
              <td><span class="badge">${row.type}</span></td>
              <td>${row.e.particulars}<div class="s" style="color:var(--muted);font-size:.72rem">${row.e.head} · All Transactions</div></td>
              <td class="num">${money(row.e.debit)}</td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="5"><div class="empty">No advances in ${ym}. Add in All Transactions or Give advance.</div></td></tr>`;
    renderPager($('#advPager'), 'advances', page, renderAdvanceTable);
  }

  function openGiveAdvance(preselectId, opts = {}) {
    const staffOnly = !!opts.staffOnly;
    let active = state.staff.filter((p) => p.quarryId === state.activeQuarryId && !p.exitDate);
    if (staffOnly) active = active.filter((p) => (p.category || 'Staff') === 'Staff');
    if (!active.length) {
      toast(staffOnly ? 'No active staff — add staff first' : 'No active people — hire first');
      return;
    }
    const pre = preselectId && active.some((p) => p.id === preselectId) ? preselectId : active[0].id;
    openModal(
      'Give advance — ' + activeQuarry().name,
      `<div class="form-grid cols-2">
        <label class="field" style="grid-column:1/-1"><span>${staffOnly ? 'Staff' : 'Person (Staff / Worker)'}</span>
          <select id="advPerson">${active
            .map((p) => `<option value="${p.id}" ${p.id === pre ? 'selected' : ''}>${staffOnly ? staffCodeOf(p) + ' · ' : ''}${p.name} · ${p.category || 'Staff'} · ${p.designation || ''}</option>`)
            .join('')}</select>
        </label>
        <label class="field"><span>Date</span><input type="date" id="advDate" value="${today()}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="advAmt" min="1" step="1" placeholder="e.g. 2000" /></label>
        <label class="field" style="grid-column:1/-1"><span>Note</span><input id="advNote" placeholder="optional — weekly adv / salary adv" /></label>
      </div>`,
      () => {
        const p = state.staff.find((x) => x.id === $('#advPerson').value);
        const amt = Number($('#advAmt').value);
        const date = $('#advDate').value || today();
        if (!p || !amt) {
          toast('Select person and amount');
          return false;
        }
        const note = ($('#advNote').value || '').trim();
        state.expenses.push({
          id: uid(),
          quarryId: state.activeQuarryId,
          date,
          type: 'Debit',
          head: 'Salary Advance',
          particulars: note || `${p.name} Salary Adv`,
          debit: amt,
          credit: 0,
          personId: p.id,
        });
        toast('Advance ₹' + amt.toLocaleString('en-IN') + ' → ' + p.name);
        return true;
      }
    );
  }

  function earnForMonth(p, days, dim, otHours = 0) {
    const rate = dayRateOf(p, dim);
    return days * rate + Number(otHours || 0) * (rate / 8);
  }

  function openOtHoursModal(staffId, day, presetHours = 4, ym = monthKey()) {
    const person = state.staff.find((x) => x.id === staffId);
    const name = person?.name || 'Person';
    const cur = parseAtt(getAtt(staffId, day, ym));
    const initial = cur.mark === 'O' ? cur.otHours : presetHours;
    openModal(
      `OT hours — ${name}`,
      `<div class="form-grid">
        <p style="color:var(--muted);font-size:.9rem;margin:0">Day ${day} · pay = hours × (day rate ÷ 8). Present day is also counted.</p>
        <div class="ot-chips" id="otChips">
          ${[2, 4, 6, 8].map((h) => `<button type="button" class="btn btn-ghost btn-sm" data-oth="${h}">${h}h</button>`).join('')}
        </div>
        <label class="field"><span>OT hours</span>
          <input type="number" id="otHoursIn" min="0.5" max="24" step="0.5" value="${initial}" />
        </label>
      </div>`,
      () => {
        const h = Number($('#otHoursIn').value);
        if (!Number.isFinite(h) || h <= 0) {
          toast('Enter OT hours (e.g. 2, 4, 8)');
          return false;
        }
        setAtt(staffId, day, formatOtMark(h), ym);
        toast(`OT ${h}h · ${name}`);
        return true;
      }
    );
    $$('#otChips [data-oth]').forEach((b) => {
      b.addEventListener('click', () => {
        $('#otHoursIn').value = b.dataset.oth;
      });
    });
    setTimeout(() => $('#otHoursIn')?.focus(), 50);
  }

  function rateLabel(p) {
    if ((p.category || 'Staff') === 'Worker' || (p.dailyRate && !p.basic)) {
      return money(p.dailyRate) + '/day';
    }
    return money(p.basic) + '/mo';
  }

  function renderPeopleTable() {
    const filter = $('#peopleFilter')?.value || 'active';
    const q = ($('#peopleSearch')?.value || '').toLowerCase().trim();
    const sort = $('#peopleSort')?.value || 'name';
    let list = state.staff.filter((p) => p.quarryId === state.activeQuarryId);
    if (filter === 'active') list = list.filter((p) => !p.exitDate);
    else if (filter === 'Left') list = list.filter((p) => p.exitDate);
    else if (filter === 'Staff' || filter === 'Worker') {
      list = list.filter((p) => !p.exitDate && (p.category || 'Staff') === filter);
    }
    if (q) {
      list = list.filter((p) =>
        `${p.name} ${p.designation} ${p.bankName} ${p.bankAc} ${p.ifsc}`.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sort === 'join-desc') return (b.joinDate || '').localeCompare(a.joinDate || '');
      if (sort === 'type') return (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name);
      if (sort === 'rate-desc') return dayRateOf(b, 30) - dayRateOf(a, 30);
      return (a.exitDate ? 1 : 0) - (b.exitDate ? 1 : 0) || a.name.localeCompare(b.name);
    });
    const page = slicePage(list, 'people', '#peoplePageSize');
    $('#peopleTable').innerHTML = page.rows.length
      ? page.rows
          .map((p) => {
            const st = personStatus(p);
            return `<tr>
              <td><strong>${p.name}</strong></td>
              <td><span class="badge ${p.category === 'Worker' ? 'warn' : 'ok'}">${p.category || 'Staff'}</span></td>
              <td>${p.designation || '—'}<div class="s" style="color:var(--muted);font-size:.75rem">${rateLabel(p)}</div></td>
              <td>${bankLabel(p)}</td>
              <td>${p.joinDate || '—'}</td>
              <td>${p.exitDate || '—'}${p.exitReason ? `<div class="s" style="color:var(--muted);font-size:.72rem">${p.exitReason}</div>` : ''}</td>
              <td><span class="badge ${st === 'Active' ? 'ok' : 'danger'}">${st}</span></td>
              <td style="white-space:nowrap">
                <button class="btn btn-ghost btn-sm" data-ledger-id="${p.id}">Ledger</button>
                <button class="btn btn-ghost btn-sm" data-edit-id="${p.id}">Edit</button>
                ${!p.exitDate ? `<button class="btn btn-danger btn-sm" data-exit-id="${p.id}">Exit</button>` : `<button class="btn btn-primary btn-sm" data-rejoin-id="${p.id}">Rejoin</button>`}
              </td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="8"><div class="empty">No people in this filter</div></td></tr>`;
    renderPager($('#peoplePager'), 'people', page, renderPeopleTable);
    $$('[data-exit-id]').forEach((b) =>
      b.addEventListener('click', () => openExitModal(b.dataset.exitId))
    );
    $$('[data-rejoin-id]').forEach((b) =>
      b.addEventListener('click', () => openRejoinModal(b.dataset.rejoinId))
    );
    $$('[data-edit-id]').forEach((b) =>
      b.addEventListener('click', () => openEditPerson(b.dataset.editId))
    );
    $$('[data-ledger-id]').forEach((b) =>
      b.addEventListener('click', () => openStaffLedger(b.dataset.ledgerId))
    );
  }

  function renderPayroll() {
    ensureAttMonthOptions();
    const ym = monthKey();
    const cat = $('#attCategory')?.value || 'all';
    const dim = daysInMonth(ym);
    const sm = $('#salaryMonthLabel');
    if (sm) sm.textContent = monthLabel(ym);

    const showPeople = cat !== 'Labour';
    const showLabour = cat === 'Labour' || cat === 'all';
    const people = showPeople ? peopleForMonth(ym, cat === 'all' ? 'all' : cat) : [];
    const gangs = showLabour ? labourForMonth(ym) : [];

    let attHtml = '';
    if (showPeople) {
      if (!people.length && !showLabour) {
        attHtml = `<div class="empty">No active Staff/Workers for ${ym}. Use + Hire or change month.</div>`;
      } else if (people.length) {
        let head = `<th class="staff-col">Name</th>`;
        for (let d = 1; d <= dim; d++) head += `<th>${d}</th>`;
        head += `<th class="num">Days</th><th class="num">OT</th>`;
        const body = people
          .map((s) => {
            const tag = s.category === 'Worker' ? 'Worker' : 'Staff';
            const st = attendanceStats(s.id, ym);
            let cells = `<td class="staff-col"><span class="att-staff-name">${s.name}</span><span class="att-staff-role">${tag} · ${s.designation || ''}</span></td>`;
            for (let d = 1; d <= dim; d++) {
              const v = getAtt(s.id, d);
              const mark = attCss(v);
              const label = attLabel(v);
              const title =
                mark === 'O'
                  ? `${s.name} · day ${d} · OT ${parseAtt(v).otHours}h`
                  : `${s.name} · day ${d}`;
              cells += `<td><button type="button" class="att-mark ${mark}${mark === 'O' ? ' ot-hrs' : ''}" data-sid="${s.id}" data-day="${d}" title="${title}">${label}</button></td>`;
            }
            cells += `<td class="num"><strong>${st.days}</strong></td><td class="num">${st.ot ? st.ot + 'h' : '—'}</td>`;
            return `<tr>${cells}</tr>`;
          })
          .join('');
        const sumDays = people.reduce((a, s) => a + attendanceStats(s.id, ym).days, 0);
        const sumOt = people.reduce((a, s) => a + attendanceStats(s.id, ym).ot, 0);
        attHtml += `
          <table class="att-table">
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
            <tfoot><tr>
              <td class="staff-col"><strong>Sum</strong></td>
              ${Array.from({ length: dim }, () => '<td></td>').join('')}
              <td class="num"><strong>${sumDays}</strong></td>
              <td class="num"><strong>${sumOt ? sumOt + 'h' : '—'}</strong></td>
            </tr></tfoot>
          </table>
          <div class="att-legend">
            <span><i class="X">X</i> Present</span>
            <span><i class="A">A</i> Absent</span>
            <span><i class="H">H</i> Half</span>
            <span><i class="L">L</i> Leave (paid)</span>
            <span><i class="O">4h</i> OT hours</span>
            <span>Staff/Worker · Days/OT sum on right · ${people.length} in ${ym}</span>
          </div>`;
      }
    }
    if (showLabour) {
      if (!gangs.length) {
        attHtml += `<div class="empty" style="margin-top:12px">No labour gangs for FY ${fyFromDate(ym + '-01')}. Add under Labour gangs.</div>`;
      } else {
        const kinds = [
          { key: 'n', label: 'Day', totalKey: 'manDays', suffix: '' },
          { key: 'night', label: 'Night', totalKey: 'night', suffix: '' },
          { key: 'ot', label: 'OT hrs', totalKey: 'ot', suffix: 'h' },
        ];
        let head = `<th class="staff-col">Gang</th><th class="att-kind-col">Type</th>`;
        for (let d = 1; d <= dim; d++) head += `<th>${d}</th>`;
        head += `<th class="num">Total</th>`;
        const body = gangs
          .map((l) => {
            const st = labourMonthStats(l.id, ym);
            return kinds
              .map((k, ki) => {
                let cells = '';
                if (ki === 0) {
                  cells += `<td class="staff-col" rowspan="3"><span class="att-staff-name">${l.name}</span><span class="att-staff-role">Contract gang · ${money(l.dayRate)}/day</span></td>`;
                }
                cells += `<td class="att-kind-col"><span class="att-kind-tag att-kind-${k.key}">${k.label}</span></td>`;
                for (let d = 1; d <= dim; d++) {
                  const cur = getLabAtt(l.id, d, ym);
                  const val = Number(cur[k.key] || 0);
                  cells += `<td><button type="button" class="att-mark ${val ? 'lab' : 'lab-empty'}" data-lid="${l.id}" data-day="${d}" title="${l.name} · ${k.label} · day ${d}">${val || '·'}</button></td>`;
                }
                const tot = st[k.totalKey] || 0;
                cells += `<td class="num"><strong>${tot ? tot + k.suffix : '—'}</strong></td>`;
                return `<tr class="att-kind-row att-kind-row-${k.key}">${cells}</tr>`;
              })
              .join('');
          })
          .join('');
        const sumMan = gangs.reduce((a, l) => a + labourMonthStats(l.id, ym).manDays, 0);
        const sumNight = gangs.reduce((a, l) => a + labourMonthStats(l.id, ym).night, 0);
        const sumLabOt = gangs.reduce((a, l) => a + labourMonthStats(l.id, ym).ot, 0);
        attHtml += `
          ${showPeople && people.length ? `<div class="att-section-label">Labour gangs (day / night / OT)</div>` : ''}
          <table class="att-table att-table-gang-split">
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
            <tfoot><tr>
              <td class="staff-col" colspan="2"><strong>Sum</strong></td>
              ${Array.from({ length: dim }, () => '<td></td>').join('')}
              <td class="num"><strong>D ${sumMan} · N ${sumNight || 0} · OT ${sumLabOt || 0}</strong></td>
            </tr></tfoot>
          </table>
          <div class="att-legend">
            <span><i class="lab">12</i> Day</span>
            <span><i class="lab">2</i> Night</span>
            <span><i class="lab">4</i> OT hours</span>
            <span>Each gang = 3 rows · tap to edit · ${gangs.length} gangs</span>
          </div>`;
      }
    }
    if (!attHtml) attHtml = `<div class="empty">Nothing to show for this filter</div>`;
    $('#attGrid').innerHTML = attHtml;

    $$('#attGrid [data-sid]').forEach((cell) => {
      cell.addEventListener('click', (e) => {
        const sid = cell.dataset.sid;
        const day = Number(cell.dataset.day);
        const ym = monthKey();
        const cur = parseAtt(getAtt(sid, day, ym));
        if (e.altKey || e.metaKey) {
          openOtHoursModal(sid, day, cur.mark === 'O' ? cur.otHours : 4, ym);
          return;
        }
        setAtt(sid, day, nextStaffAttValue(cur), ym);
        save(state);
        renderPayroll();
      });
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const sid = cell.dataset.sid;
        const day = Number(cell.dataset.day);
        const ym = monthKey();
        const cur = parseAtt(getAtt(sid, day, ym));
        openOtHoursModal(sid, day, cur.mark === 'O' ? cur.otHours || 4 : 4, ym);
      });
    });
    $$('#attGrid [data-lid]').forEach((cell) => {
      cell.addEventListener('click', () => openLabDayModal(cell.dataset.lid, Number(cell.dataset.day)));
    });

    const salQ = ($('#salSearch')?.value || '').toLowerCase().trim();
    const salSort = $('#salSort')?.value || 'name';
    let payPeople = peopleForMonth(ym, 'all').map((s) => ({
      kind: 'person',
      id: s.id,
      name: s.name,
      type: s.category || 'Staff',
      desig: s.designation || '—',
      rate: rateLabel(s),
      row: salaryRow(s, ym, dim),
      s,
    }));
    labourForMonth(ym).forEach((l) => {
      payPeople.push({
        kind: 'labour',
        id: l.id,
        name: l.name,
        type: 'Gang',
        desig: 'Contract labour',
        rate: money(l.dayRate) + '/day',
        row: labourSalaryRow(l, ym),
        l,
      });
    });
    if (salQ) {
      payPeople = payPeople.filter((r) =>
        `${r.name} ${r.desig} ${r.type}`.toLowerCase().includes(salQ)
      );
    }
    payPeople.sort((a, b) => {
      if (salSort === 'net-desc') return b.row.net - a.row.net;
      if (salSort === 'net-asc') return a.row.net - b.row.net;
      if (salSort === 'status') return (a.row.paid ? 1 : 0) - (b.row.paid ? 1 : 0) || a.name.localeCompare(b.name);
      if (salSort === 'type') return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    const salPage = slicePage(payPeople, 'salary', '#salPageSize');
    $('#salaryTable').innerHTML = salPage.rows.length
      ? salPage.rows
          .map((item) => {
            const { days, ot, earned, adv, net, paid } = item.row;
            const canPay = !paid && net > 0;
            const status = paid
              ? `<span class="badge ok">Paid · ${paid.mode}</span><div class="s" style="color:var(--muted);font-size:.72rem">${paid.date}</div>`
              : net > 0
                ? `<span class="badge warn">Unpaid</span>`
                : `<span class="badge">₹0</span>`;
            const action =
              item.kind === 'labour'
                ? canPay
                  ? `<button class="btn btn-primary btn-sm" data-pay-lab="${item.id}">Pay</button>`
                  : paid
                    ? `<button class="btn btn-ghost btn-sm" data-unpay-lab="${item.id}">Undo</button>`
                    : ''
                : canPay
                  ? `<button class="btn btn-primary btn-sm" data-pay-id="${item.id}">Pay</button>`
                  : paid
                    ? `<button class="btn btn-ghost btn-sm" data-unpay-id="${item.id}">Undo</button>`
                    : '';
            const check = canPay
              ? `<input type="checkbox" class="sal-check" value="${item.kind}:${item.id}" aria-label="Select ${item.name}" />`
              : '';
            const typeBadge = item.type === 'Gang' ? 'warn' : item.type === 'Worker' ? 'warn' : 'ok';
            return `<tr>
              <td>${check}</td>
              <td><strong>${item.name}</strong></td>
              <td><span class="badge ${typeBadge}">${item.type}</span></td>
              <td>${item.desig}</td>
              <td class="num">${item.rate}</td>
              <td class="num">${days}</td>
              <td class="num">${ot ? ot + 'h' : '—'}</td>
              <td class="num">${money(earned)}</td>
              <td class="num">${money(adv)}</td>
              <td class="num"><strong>${money(net)}</strong></td>
              <td>${status}</td>
              <td>${action}</td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="12"><div class="empty">No active people / gangs for ${ym}</div></td></tr>`;
    const salSum = {
      days: payPeople.reduce((a, p) => a + Number(p.row.days || 0), 0),
      ot: payPeople.reduce((a, p) => a + Number(p.row.ot || 0), 0),
      earned: payPeople.reduce((a, p) => a + Number(p.row.earned || 0), 0),
      adv: payPeople.reduce((a, p) => a + Number(p.row.adv || 0), 0),
      net: payPeople.reduce((a, p) => a + Number(p.row.net || 0), 0),
      n: payPeople.length,
    };
    if ($('#salaryFoot')) {
      $('#salaryFoot').innerHTML = payPeople.length
        ? `<tr>
            <td></td>
            <td colspan="3"><strong>Sum</strong> <span style="color:var(--muted);font-weight:400;font-size:.8rem">(${salSum.n} rows)</span></td>
            <td></td>
            <td class="num"><strong>${salSum.days}</strong></td>
            <td class="num"><strong>${salSum.ot ? salSum.ot + 'h' : '—'}</strong></td>
            <td class="num"><strong>${money(salSum.earned)}</strong></td>
            <td class="num"><strong>${money(salSum.adv)}</strong></td>
            <td class="num"><strong>${money(salSum.net)}</strong></td>
            <td colspan="2"></td>
          </tr>`
        : '';
    }
    renderPager($('#salPager'), 'salary', salPage, renderPayroll);

    $$('[data-pay-id]').forEach((b) =>
      b.addEventListener('click', () => openPaySalary(b.dataset.payId))
    );
    $$('[data-unpay-id]').forEach((b) =>
      b.addEventListener('click', () => reverseSalaryPayment(b.dataset.unpayId))
    );
    $$('[data-pay-lab]').forEach((b) =>
      b.addEventListener('click', () => openPayLabour(b.dataset.payLab))
    );
    $$('[data-unpay-lab]').forEach((b) =>
      b.addEventListener('click', () => reverseLabourPayment(b.dataset.unpayLab))
    );
    $$('#salaryTable input.sal-check').forEach((c) =>
      c.addEventListener('change', syncSalarySelectUI)
    );
    const selAll = $('#salSelectAll');
    if (selAll) {
      selAll.checked = false;
      selAll.indeterminate = false;
      selAll.onchange = () => {
        $$('#salaryTable input.sal-check').forEach((c) => {
          c.checked = selAll.checked;
        });
        syncSalarySelectUI();
      };
    }
    syncSalarySelectUI();

    renderPeopleTable();
    renderAdvanceTable();
    renderStaffLedger();
    renderLabourGangs();
  }

  function ensureLabourFyOptions() {
    const sels = [$('#labourFy'), $('#smLabourFy')].filter(Boolean);
    if (!sels.length) return;
    const fys = [...new Set([...(state.years || []), ...state.labour.map((l) => l.fy)].filter(Boolean))];
    fys.sort().reverse();
    const cur = labourFyKey();
    const value = fys.includes(cur) ? cur : fys[0] || activeYear();
    sels.forEach((sel) => {
      sel.innerHTML = fys.map((y) => `<option value="${y}">FY ${y}</option>`).join('');
      sel.value = value;
      if (!sel.dataset.bound) {
        sel.dataset.bound = '1';
        sel.addEventListener('change', () => {
          const v = sel.value;
          sels.forEach((s) => {
            if (s !== sel && [...s.options].some((o) => o.value === v)) s.value = v;
          });
          renderLabourGangs();
        });
      }
    });
  }

  function renderLabourGangs() {
    ensureLabourFyOptions();
    const fy = labourFyKey();
    const ym = monthKey();
    const labour = quarryLabour(fy).sort((a, b) => a.name.localeCompare(b.name));
    const monthRows = labour.map((l) => ({ l, m: labourSalaryRow(l, ym), fyT: labourTotals(l) }));
    const sumWage = monthRows.reduce((s, r) => s + r.m.earned, 0);
    const sumAdv = monthRows.reduce((s, r) => s + r.m.adv, 0);
    const sumPend = monthRows.reduce((s, r) => s + r.m.net, 0);

    // Payroll → Labour (full detail)
    if ($('#labourTable')) {
      if ($('#labourStats')) {
        $('#labourStats').innerHTML = `
          <div class="card"><h3>Gangs</h3><div class="stat">${labour.length}</div><div class="hint">FY ${fy} · ${monthLabel(ym)}</div></div>
          <div class="card"><h3>Month wage</h3><div class="stat">${money(sumWage)}</div><div class="hint">From attendance headcount</div></div>
          <div class="card"><h3>Month advances</h3><div class="stat danger">${money(sumAdv)}</div></div>
          <div class="card"><h3>Month net</h3><div class="stat ${sumPend > 0 ? 'warn' : 'ok'}">${money(sumPend)}</div></div>`;
      }
      $('#labourTable').innerHTML = monthRows.length
        ? monthRows
            .map(({ l, m, fyT }) => {
              return `<tr>
              <td><strong>${l.name}</strong><div class="s" style="color:var(--muted);font-size:.72rem">FY ${l.fy}</div></td>
              <td class="num">${m.days}<div class="s" style="color:var(--muted);font-size:.7rem">${m.workDays} days worked</div></td>
              <td class="num">${money(l.dayRate)}</td>
              <td class="num">${m.night || '—'}<div class="s" style="color:var(--muted);font-size:.7rem">${money(l.otNightRate || l.dayRate)}/n</div></td>
              <td class="num">${m.ot ? m.ot + 'h' : '—'}<div class="s" style="color:var(--muted);font-size:.7rem">${money(l.otHourRate)}/h</div></td>
              <td class="num">${l.mastiri ? money(l.mastiri) : '—'}</td>
              <td class="num"><strong>${money(m.earned)}</strong></td>
              <td class="num">${money(m.adv)}<div class="s" style="color:var(--muted);font-size:.7rem">FY cash ${money(fyT.cash)}</div></td>
              <td class="num" style="color:${m.net > 0 ? 'var(--warn)' : 'var(--ok)'}"><strong>${money(m.net)}</strong>${m.paid ? `<div class="s" style="color:var(--ok);font-size:.7rem">Paid</div>` : ''}</td>
              <td style="white-space:nowrap">
                <button class="btn btn-ghost btn-sm" data-edit-lab="${l.id}">Rates</button>
                <button class="btn btn-ghost btn-sm" data-adv-lab="${l.id}">Advance</button>
                ${!m.paid && m.net > 0 ? `<button class="btn btn-primary btn-sm" data-pay-lab-tab="${l.id}">Pay</button>` : ''}
              </td>
            </tr>`;
            })
            .join('')
        : `<tr><td colspan="10"><div class="empty">No labour gangs for ${contextLabel()} · FY ${fy}. Use + Add gang.</div></td></tr>`;
      if ($('#labourAdvanceNote')) {
        $('#labourAdvanceNote').innerHTML = labour.length
          ? `<p style="color:var(--muted);font-size:.82rem;margin:0">Month wage from Attendance headcount. Pay on Salary sheet or here.</p>`
          : '';
      }
      const thead = $('#labourTable')?.closest('table')?.querySelector('thead tr');
      if (thead) {
        thead.innerHTML = `<th>Gang</th><th class="num">Day</th><th class="num">Day rate</th><th class="num">Night</th><th class="num">OT hrs</th><th class="num">Mastiri</th><th class="num">Month wage</th><th class="num">Month adv</th><th class="num">Net</th><th></th>`;
      }
    }

    // Staff Management → Contract group (name list only)
    if ($('#smLabourTable')) {
      $('#smLabourTable').innerHTML = labour.length
        ? labour
            .map(
              (l) => `<tr data-gang-row="${l.id}" style="cursor:pointer">
              <td><strong>${l.name}</strong></td>
              <td>${l.fy || '—'}</td>
              <td style="white-space:nowrap">
                <button class="btn btn-ghost btn-sm" data-edit-lab-sm="${l.id}">Edit</button>
              </td>
            </tr>`
            )
            .join('')
        : `<tr><td colspan="3"><div class="empty">No contract groups · FY ${fy}</div></td></tr>`;
      $$('#smLabourTable [data-gang-row]').forEach((tr) =>
        tr.addEventListener('click', (e) => {
          if (e.target.closest('[data-edit-lab-sm]')) return;
          go('gang', { gangId: tr.dataset.gangRow });
        })
      );
      $$('#smLabourTable [data-edit-lab-sm]').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditLabour(b.dataset.editLabSm, { simple: true });
        })
      );
    }

    $$('#labourTable [data-edit-lab]').forEach((b) =>
      b.addEventListener('click', () => openEditLabour(b.dataset.editLab))
    );
    $$('[data-adv-lab]').forEach((b) =>
      b.addEventListener('click', () => openGiveLabourAdvance(b.dataset.advLab))
    );
    $$('[data-pay-lab-tab]').forEach((b) =>
      b.addEventListener('click', () => openPayLabour(b.dataset.payLabTab))
    );
  }

  function openEditLabour(labourId, opts = {}) {
    const l = state.labour.find((x) => x.id === labourId);
    if (!l) return;
    const simple = !!opts.simple;
    const body = simple
      ? `<div class="form-grid cols-2">
        <label class="field"><span>Gang name</span><input id="lbName" value="${l.name.replace(/"/g, '&quot;')}" /></label>
        <label class="field"><span>FY</span>
          <select id="lbFy">${(state.years || []).map((y) => `<option value="${y}" ${y === l.fy ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Day rate</span><input type="number" id="lbDayRate" value="${l.dayRate}" /></label>
        <label class="field"><span>Night rate</span><input type="number" id="lbOtNR" value="${l.otNightRate || l.dayRate}" /></label>
        <label class="field"><span>Opening advance</span><input type="number" id="lbOpen" value="${l.openingAdvance || 0}" /></label>
      </div>`
      : `<div class="form-grid cols-2">
        <label class="field"><span>Gang name</span><input id="lbName" value="${l.name.replace(/"/g, '&quot;')}" /></label>
        <label class="field"><span>FY</span>
          <select id="lbFy">${(state.years || []).map((y) => `<option value="${y}" ${y === l.fy ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Man-days</span><input type="number" id="lbDays" step="0.5" value="${l.days}" /></label>
        <label class="field"><span>Day rate</span><input type="number" id="lbDayRate" value="${l.dayRate}" /></label>
        <label class="field"><span>OT nights (FY)</span><input type="number" id="lbOtN" step="0.5" value="${l.otNight || 0}" /></label>
        <label class="field"><span>Night rate</span><input type="number" id="lbOtNR" value="${l.otNightRate || l.dayRate}" /></label>
        <label class="field"><span>OT hours</span><input type="number" id="lbOtH" step="0.5" value="${l.otHours || 0}" /></label>
        <label class="field"><span>OT hour rate</span><input type="number" id="lbOtHR" step="0.01" value="${l.otHourRate || 0}" /></label>
        <label class="field"><span>Mastiri</span><input type="number" id="lbMast" value="${l.mastiri || 0}" /></label>
        <label class="field"><span>Opening advance</span><input type="number" id="lbOpen" value="${l.openingAdvance || 0}" /></label>
      </div>`;
    openModal('Edit gang — ' + l.name, body, () => {
      l.name = $('#lbName').value.trim() || l.name;
      l.fy = $('#lbFy').value || l.fy;
      l.dayRate = Number($('#lbDayRate').value) || 0;
      l.otNightRate = Number($('#lbOtNR').value) || l.dayRate;
      l.openingAdvance = Number($('#lbOpen').value) || 0;
      if (!simple) {
        l.days = Number($('#lbDays').value) || 0;
        l.otNight = Number($('#lbOtN').value) || 0;
        l.otHours = Number($('#lbOtH').value) || 0;
        l.otHourRate = Number($('#lbOtHR').value) || 0;
        l.mastiri = Number($('#lbMast').value) || 0;
      }
      toast('Gang updated · ' + l.name);
      return true;
    });
  }

  function renderGangDetail() {
    const l = selectedGangId
      ? state.labour.find((x) => x.id === selectedGangId && x.quarryId === state.activeQuarryId)
      : null;
    if (!l) {
      staffMgmtTab = 'gangs';
      go('staffmgmt');
      return;
    }
    const t = labourTotals(l);
    const wagePaid = labourWageTotal(l.id, l.name, l.fy);
    const txns = labourTxnRows(l.id, l.name, l.fy);
    if ($('#gangDetailTitle')) $('#gangDetailTitle').textContent = l.name;
    if ($('#gangDetailSub')) {
      $('#gangDetailSub').textContent = `FY ${l.fy || '—'} · ${money(l.dayRate)}/day`;
    }
    if ($('#gangDetailBal')) {
      $('#gangDetailBal').innerHTML = `
        <small>Advances</small>
        <strong class="${t.adv ? 'neg' : ''}">${money(t.adv)}</strong>`;
    }
    if ($('#gangDetailProfile')) {
      const initials = (l.name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
      $('#gangDetailProfile').innerHTML = `
        <div class="staff-profile">
          <div class="staff-profile-hero">
            <div class="staff-avatar" aria-hidden="true">${initials}</div>
            <div class="staff-profile-hero-main">
              <h3>${l.name}</h3>
              <div class="staff-profile-meta">
                <span class="badge ok">Contract group</span>
                <span style="color:var(--muted);font-size:.8rem">FY ${l.fy || '—'}</span>
              </div>
            </div>
            <div class="staff-profile-pay">
              <small>Day rate</small>
              <strong>${money(l.dayRate)}/day</strong>
            </div>
          </div>
          <div class="grid grid-3" style="padding:12px 16px 16px;gap:10px">
            <div class="card"><h3>Opening</h3><div class="stat">${money(t.opening)}</div><div class="hint">Opening advance</div></div>
            <div class="card"><h3>Advances</h3><div class="stat danger">${money(t.cash)}</div><div class="hint">Cash this FY</div></div>
            <div class="card"><h3>Payments</h3><div class="stat">${money(wagePaid)}</div><div class="hint">Wage paid this FY</div></div>
          </div>
        </div>`;
    }

    if ($('#gangDetailTxnTable')) {
      $('#gangDetailTxnTable').innerHTML = txns.length
        ? txns
            .map(
              (r) => `<tr>
              <td><span class="badge ${r.type === 'Advance' ? 'warn' : 'ok'}">${r.type}</span></td>
              <td>${r.date || '—'}</td>
              <td>${r.particulars}</td>
              <td class="num">${money(r.amount)}</td>
            </tr>`
            )
            .join('')
        : `<tr><td colspan="4"><div class="empty">No advances or wage payments · FY ${l.fy}</div></td></tr>`;
    }
  }

  function openAddLabour(opts = {}) {
    const fy = labourFyKey();
    const simple = !!opts.simple;
    const body = simple
      ? `<div class="form-grid cols-2">
        <label class="field"><span>Gang name</span><input id="lbName" placeholder="e.g. Pullu Labour" /></label>
        <label class="field"><span>FY</span>
          <select id="lbFy">${(state.years || []).map((y) => `<option value="${y}" ${y === fy ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Day rate</span><input type="number" id="lbDayRate" value="550" /></label>
        <label class="field"><span>Night rate</span><input type="number" id="lbOtNR" value="550" /></label>
        <label class="field"><span>Opening advance</span><input type="number" id="lbOpen" value="0" /></label>
      </div>`
      : `<div class="form-grid cols-2">
        <label class="field"><span>Gang name</span><input id="lbName" placeholder="e.g. Pullu Labour" /></label>
        <label class="field"><span>FY</span>
          <select id="lbFy">${(state.years || []).map((y) => `<option value="${y}" ${y === fy ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Man-days</span><input type="number" id="lbDays" step="0.5" value="0" /></label>
        <label class="field"><span>Day rate</span><input type="number" id="lbDayRate" value="550" /></label>
        <label class="field"><span>OT nights (FY)</span><input type="number" id="lbOtN" step="0.5" value="0" /></label>
        <label class="field"><span>Night rate</span><input type="number" id="lbOtNR" value="550" /></label>
        <label class="field"><span>OT hours</span><input type="number" id="lbOtH" step="0.5" value="0" /></label>
        <label class="field"><span>OT hour rate</span><input type="number" id="lbOtHR" step="0.01" value="68.75" /></label>
        <label class="field"><span>Mastiri</span><input type="number" id="lbMast" value="0" /></label>
        <label class="field"><span>Opening advance</span><input type="number" id="lbOpen" value="0" /></label>
      </div>`;
    openModal('Add labour gang — ' + activeQuarry().name, body, () => {
      const name = $('#lbName').value.trim();
      if (!name) {
        toast('Gang name required');
        return false;
      }
      state.labour.push({
        id: uid(),
        quarryId: state.activeQuarryId,
        fy: $('#lbFy').value || fy,
        name,
        days: simple ? 0 : Number($('#lbDays').value) || 0,
        dayRate: Number($('#lbDayRate').value) || 0,
        otNight: simple ? 0 : Number($('#lbOtN').value) || 0,
        otNightRate: Number($('#lbOtNR').value) || Number($('#lbDayRate').value) || 0,
        otHours: simple ? 0 : Number($('#lbOtH').value) || 0,
        otHourRate: simple ? (Number($('#lbDayRate').value) || 0) / 8 : Number($('#lbOtHR').value) || 0,
        mastiri: simple ? 0 : Number($('#lbMast').value) || 0,
        openingAdvance: Number($('#lbOpen').value) || 0,
      });
      toast('Gang added · ' + name);
      return true;
    });
  }

  function openGiveLabourAdvance(preLabourId) {
    const gangs = quarryLabourAll().sort((a, b) => a.name.localeCompare(b.name) || b.fy.localeCompare(a.fy));
    if (!gangs.length) {
      toast('No labour gangs — add a gang first');
      return;
    }
    const pre = preLabourId && gangs.some((g) => g.id === preLabourId) ? preLabourId : gangs[0].id;
    openModal(
      'Labour advance — ' + activeQuarry().name,
      `<div class="form-grid cols-2">
        <label class="field" style="grid-column:1/-1"><span>Labour gang</span>
          <select id="laGang">${gangs
            .map((g) => `<option value="${g.id}" ${g.id === pre ? 'selected' : ''}>${g.name} · FY ${g.fy}</option>`)
            .join('')}</select>
        </label>
        <label class="field"><span>Date</span><input type="date" id="laDate" value="${today()}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="laAmt" min="1" placeholder="e.g. 15000" /></label>
        <label class="field" style="grid-column:1/-1"><span>Note</span><input id="laNote" placeholder="optional" /></label>
      </div>`,
      () => {
        const g = state.labour.find((x) => x.id === $('#laGang').value);
        const amt = Number($('#laAmt').value);
        if (!g || !amt) {
          toast('Select gang and amount');
          return false;
        }
        const note = ($('#laNote').value || '').trim();
        state.expenses.push({
          id: uid(),
          quarryId: state.activeQuarryId,
          date: $('#laDate').value || today(),
          type: 'Debit',
          head: 'Labour Advance',
          particulars: note || `${g.name} A/c Adv`,
          debit: amt,
          credit: 0,
          labourId: g.id,
        });
        toast('Labour advance ₹' + amt.toLocaleString('en-IN') + ' → ' + g.name);
        return true;
      }
    );
  }

  function openExitModal(personId) {
    const p = state.staff.find((x) => x.id === personId);
    if (!p) return;
    openModal(
      'Mark exit — ' + p.name,
      `<div class="form-grid">
        <p style="color:var(--muted);font-size:.9rem">After exit date, ${p.name} will not appear in attendance / salary for later months. History stays.</p>
        <label class="field"><span>Exit date</span><input type="date" id="exDate" value="${today()}" /></label>
        <label class="field"><span>Reason</span><input id="exReason" placeholder="Left / stopped suddenly / transferred" /></label>
      </div>`,
      () => {
        const d = $('#exDate').value;
        if (!d) {
          toast('Exit date required');
          return false;
        }
        if (p.joinDate && d < p.joinDate) {
          toast('Exit cannot be before join date');
          return false;
        }
        p.exitDate = d;
        p.exitReason = $('#exReason').value.trim() || 'Left';
        pushEmployment(p, 'Exit', d, p.exitReason);
        toast(p.name + ' marked exited');
        return true;
      }
    );
  }

  function openRejoinModal(personId) {
    const p = state.staff.find((x) => x.id === personId);
    if (!p) return;
    if (!p.exitDate) {
      toast('Person is already active');
      return;
    }
    openModal(
      'Rejoin — ' + p.name,
      `<div class="form-grid">
        <p style="color:var(--muted);font-size:.9rem">Was exited on ${p.exitDate}${p.exitReason ? ' · ' + p.exitReason : ''}. Rejoin brings them back to attendance from the new join date.</p>
        <label class="field"><span>Rejoin date</span><input type="date" id="rjDate" value="${today()}" /></label>
        <label class="field"><span>Note</span><input id="rjNote" placeholder="Rejoined quarry" value="Rejoined" /></label>
      </div>`,
      () => {
        const d = $('#rjDate').value;
        if (!d) {
          toast('Rejoin date required');
          return false;
        }
        if (p.exitDate && d <= p.exitDate) {
          toast('Rejoin must be after last exit date');
          return false;
        }
        p.joinDate = d;
        p.exitDate = null;
        p.exitReason = '';
        pushEmployment(p, 'Rejoin', d, $('#rjNote').value.trim() || 'Rejoined');
        toast(p.name + ' rejoined');
        return true;
      }
    );
  }

  let selectedStaffId = null;

  function personSalaryVouchers(personId) {
    return quarryExpenses().filter(
      (e) => e.personId === personId && (e.head === 'Salary' || e.salaryPaymentId)
    );
  }

  function personAllAdvances(personId, personName) {
    return personAdvances(personId, personName, null);
  }

  /** Staff ledger: Advance = Debit, Salary = Credit, Other linked expenses. Employment lives on Timeline tab. */
  function staffLedgerTxns(personId) {
    const p = state.staff.find((x) => x.id === personId);
    if (!p) return [];
    const txns = [];
    personAllAdvances(personId, p.name).forEach((e) => {
      const amt = Number(e.debit) || 0;
      txns.push({
        id: e.id,
        type: 'Advance',
        date: e.date,
        particulars: e.particulars,
        head: e.head,
        debit: amt,
        credit: 0,
        signed: amt,
        money: true,
      });
    });
    personSalaryVouchers(personId).forEach((e) => {
      const amt = Number(e.debit) || 0;
      txns.push({
        id: e.id,
        type: 'Salary',
        date: e.date,
        particulars: e.particulars,
        head: e.head || 'Salary',
        debit: 0,
        credit: amt,
        signed: -amt,
        money: true,
      });
    });
    (state.salaryPayments || [])
      .filter((pay) => pay.personId === personId && pay.quarryId === state.activeQuarryId)
      .forEach((pay) => {
        const already = txns.some((t) => t.id === pay.expenseId || (pay.id && t.id === pay.id));
        const hasVoucher = quarryExpenses().some((e) => e.salaryPaymentId === pay.id);
        if (already || hasVoucher) return;
        const amt = Number(pay.net || pay.amount || 0);
        txns.push({
          id: pay.id,
          type: 'Salary',
          date: pay.date || `${pay.ym}-28`,
          particulars: `Salary ${pay.ym} · ${pay.mode || ''}`.trim(),
          head: 'Salary',
          debit: 0,
          credit: amt,
          signed: -amt,
          money: true,
        });
      });
    const knownIds = new Set(txns.map((t) => t.id));
    quarryExpenses()
      .filter((e) => {
        if (e.personId !== personId) return false;
        if (knownIds.has(e.id)) return false;
        if (e.head === 'Salary' || e.salaryPaymentId) return false;
        if (isAdvanceHead(e.head)) return false;
        const amt = Number(e.debit) || Number(e.credit) || 0;
        return amt > 0;
      })
      .forEach((e) => {
        const debit = Number(e.debit) || 0;
        const credit = Number(e.credit) || 0;
        txns.push({
          id: e.id,
          type: 'Other',
          date: e.date,
          particulars: e.particulars,
          head: e.head || 'Other',
          debit,
          credit,
          signed: debit - credit,
          money: true,
        });
      });
    txns.sort((a, b) => a.date.localeCompare(b.date) || String(a.type).localeCompare(String(b.type)));
    let bal = 0;
    return txns.map((t) => {
      if (t.money) bal += t.signed;
      return { ...t, balance: bal };
    });
  }

  function staffLedgerBalance(personId) {
    const rows = staffLedgerTxns(personId).filter((t) => t.money);
    return rows.length ? rows[rows.length - 1].balance : 0;
  }

  function goPayrollTab(name) {
    $$('#payrollTabs .tab').forEach((x) => x.classList.toggle('active', x.dataset.ptab === name));
    $$('.ptab').forEach((p) => (p.style.display = 'none'));
    const el = $('#ptab-' + name);
    if (el) el.style.display = 'block';
  }

  function openStaffLedger(personId) {
    selectedStaffId = personId;
    go('payroll');
    goPayrollTab('ledger');
    renderStaffLedger();
  }

  function renderStaffLedger() {
    if (!$('#staffLedgerList')) return;
    const q = ($('#staffLedgerSearch')?.value || '').toLowerCase().trim();
    let list = state.staff
      .filter((p) => p.quarryId === state.activeQuarryId)
      .sort((a, b) => (a.exitDate ? 1 : 0) - (b.exitDate ? 1 : 0) || a.name.localeCompare(b.name));
    if (q) {
      list = list.filter((p) =>
        `${p.name} ${p.designation} ${p.category}`.toLowerCase().includes(q)
      );
    }
    if (!selectedStaffId || !list.some((p) => p.id === selectedStaffId)) {
      selectedStaffId = list[0]?.id || null;
    }

    $('#staffLedgerList').innerHTML = list.length
      ? list
          .map((p) => {
            const bal = staffLedgerBalance(p.id);
            const st = personStatus(p);
            return `<button type="button" class="party-item ${p.id === selectedStaffId ? 'active' : ''}" data-staff="${p.id}">
              <span class="party-item-name">${p.name}<small>${p.category || 'Staff'} · ${p.designation || '—'} · ${st}</small></span>
              <span class="party-item-amt ${bal > 0 ? 'neg' : bal < 0 ? 'pos' : ''}">${money(Math.abs(bal))}${bal > 0 ? ' Dr' : bal < 0 ? ' Cr' : ''}</span>
            </button>`;
          })
          .join('')
      : `<div class="empty">No people in this quarry</div>`;

    $$('#staffLedgerList [data-staff]').forEach((b) =>
      b.addEventListener('click', () => {
        selectedStaffId = b.dataset.staff;
        renderStaffLedger();
      })
    );

    const person = state.staff.find((p) => p.id === selectedStaffId);
    if (!person) {
      $('#staffLedgerHead').innerHTML = `<div class="empty" style="padding:24px">Select a person</div>`;
      $('#staffTxnTable').innerHTML = `<tr><td colspan="6"><div class="empty">No person selected</div></td></tr>`;
      return;
    }

    const bal = staffLedgerBalance(person.id);
    const emp = ensureEmploymentHistory(person);
    const lastJoin = [...emp].reverse().find((e) => e.kind === 'Join' || e.kind === 'Rejoin');
    $('#staffLedgerHead').innerHTML = `
      <div>
        <h2>${person.name}</h2>
        <div class="s" style="color:var(--muted);font-size:.85rem;margin-top:4px">
          ${person.category || 'Staff'} · ${person.designation || '—'} · ${personStatus(person)}
          · Join ${person.joinDate || '—'}${person.exitDate ? ' · Exit ' + person.exitDate : ''}
          ${lastJoin && lastJoin.kind === 'Rejoin' ? ' · last rejoin ' + lastJoin.date : ''}
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          ${!person.exitDate ? `<button class="btn btn-danger btn-sm" id="slExitBtn">Mark exit</button>` : `<button class="btn btn-primary btn-sm" id="slRejoinBtn">Rejoin</button>`}
          <button class="btn btn-ghost btn-sm" id="slAdvanceBtn">Give advance</button>
        </div>
      </div>
      <div class="party-bal-card">
        <small>Advance − Salary (Dr = advance pending)</small>
        <strong class="${bal > 0 ? 'neg' : bal < 0 ? 'pos' : ''}">${money(Math.abs(bal))} ${bal > 0 ? 'Dr' : bal < 0 ? 'Cr' : ''}</strong>
      </div>`;

    $('#slExitBtn')?.addEventListener('click', () => openExitModal(person.id));
    $('#slRejoinBtn')?.addEventListener('click', () => openRejoinModal(person.id));
    $('#slAdvanceBtn')?.addEventListener('click', () => openGiveAdvance(person.id));

    let txns = staffLedgerTxns(person.id).slice().reverse();
    const tq = ($('#staffTxnSearch')?.value || '').toLowerCase().trim();
    if (tq) {
      txns = txns.filter((t) =>
        `${t.type} ${t.particulars} ${t.head} ${t.date}`.toLowerCase().includes(tq)
      );
    }

    const badgeClass = (type) => {
      if (type === 'Salary' || type === 'Join' || type === 'Rejoin') return 'ok';
      if (type === 'Advance' || type === 'Exit') return 'danger';
      return '';
    };

    $('#staffTxnTable').innerHTML = txns.length
      ? txns
          .map(
            (t) => `<tr>
              <td><span class="badge ${badgeClass(t.type)}">${t.type}</span></td>
              <td>${t.date}</td>
              <td>${t.particulars}<div class="s" style="color:var(--muted);font-size:.72rem">${t.head}</div></td>
              <td class="num">${t.debit ? money(t.debit) : '—'}</td>
              <td class="num">${t.credit ? money(t.credit) : '—'}</td>
              <td class="num ${t.money ? (t.balance > 0 ? 'neg' : t.balance < 0 ? 'pos' : '') : ''}">${t.money ? `${money(Math.abs(t.balance))} ${t.balance > 0 ? 'Dr' : t.balance < 0 ? 'Cr' : ''}` : '—'}</td>
            </tr>`
          )
          .join('')
      : `<tr><td colspan="6"><div class="empty">No salary / advance history yet</div></td></tr>`;
  }

  function exportStaffLedger(kind) {
    const person = state.staff.find((p) => p.id === selectedStaffId);
    if (!person) {
      toast('Select a person');
      return;
    }
    const rows = staffLedgerTxns(person.id);
    if (kind === 'excel') {
      downloadCsv(
        `staff-ledger-${person.name.replace(/\s+/g, '-')}-${activeQuarry().code}.csv`,
        [
          ['Type', 'Date', 'Comment', 'Category', 'Debit', 'Credit', 'Balance'],
          ...rows.map((t) => [t.type, t.date, t.particulars, t.head, t.debit, t.credit, t.money ? t.balance : '']),
        ]
      );
      toast('Excel downloaded');
      return;
    }
    const body = rows
      .map(
        (t) => `<tr>
          <td>${t.type}</td><td>${t.date}</td><td>${t.particulars}</td>
          <td class="num">${t.debit || '—'}</td><td class="num">${t.credit || '—'}</td>
          <td class="num">${t.money ? t.balance : '—'}</td>
        </tr>`
      )
      .join('');
    printReport(
      `Staff ledger · ${person.name}`,
      `<table><thead><tr><th>Type</th><th>Date</th><th>Comment</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>${body}</tbody></table>`
    );
  }

  $$('#payrollTabs .tab').forEach((t) =>
    t.addEventListener('click', () => {
      $$('#payrollTabs .tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      $$('.ptab').forEach((p) => (p.style.display = 'none'));
      const el = $('#ptab-' + t.dataset.ptab);
      if (el) el.style.display = 'block';
      if (t.dataset.ptab === 'ledger') renderStaffLedger();
      if (t.dataset.ptab === 'people') renderPeopleTable();
      if (t.dataset.ptab === 'advances') renderAdvanceTable();
      if (t.dataset.ptab === 'labour') renderLabourGangs();
    })
  );
  $('#recalcSalary')?.addEventListener('click', () => {
    toast('Pay recalculated from attendance');
    renderPayroll();
  });
  $('#payAllSalaryBtn')?.addEventListener('click', openPayAllSalary);
  $('#paySelectedSalaryBtn')?.addEventListener('click', openPaySelectedSalary);
  $('#exportAttExcel')?.addEventListener('click', exportAttendanceExcel);
  $('#exportAttPdf')?.addEventListener('click', exportAttendancePdf);
  $('#exportSalExcel')?.addEventListener('click', exportSalaryExcel);
  $('#exportSalPdf')?.addEventListener('click', exportSalaryPdf);
  $('#attCategory')?.addEventListener('change', renderPayroll);
  $('#peopleFilter')?.addEventListener('change', () => {
    tableUI.people.page = 1;
    renderPeopleTable();
  });
  $('#giveAdvanceBtn')?.addEventListener('click', openGiveAdvance);
  $('#giveAdvanceBtn2')?.addEventListener('click', openGiveAdvance);

  const bindTableTools = (ids, key, rerender) => {
    ids.forEach((id) => {
      const el = $(id);
      if (!el || el.dataset.bound) return;
      el.dataset.bound = '1';
      const resetPage = () => {
        tableUI[key].page = 1;
        rerender();
      };
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', resetPage);
    });
  };
  bindTableTools(['#salSearch', '#salSort', '#salPageSize'], 'salary', renderPayroll);
  bindTableTools(['#advSearch', '#advSort', '#advPageSize'], 'advances', renderAdvanceTable);
  bindTableTools(['#peopleSearch', '#peopleSort', '#peoplePageSize'], 'people', renderPeopleTable);

  $('#staffLedgerSearch')?.addEventListener('input', renderStaffLedger);
  $('#staffTxnSearch')?.addEventListener('input', renderStaffLedger);
  $('#staffTxnExcel')?.addEventListener('click', () => exportStaffLedger('excel'));
  $('#staffTxnPdf')?.addEventListener('click', () => exportStaffLedger('pdf'));

  $('#addLabourBtn')?.addEventListener('click', openAddLabour);
  $('#labourAdvanceBtn')?.addEventListener('click', () => openGiveLabourAdvance());

  /* ---------- Staff Management (profiles — does not change Payroll flows) ---------- */
  function escAttr(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function ensureStaffCode(p) {
    if (p.code) return p.code;
    const n = state.staff.filter((x) => (x.category || 'Staff') === 'Staff').length + 1;
    p.code = 'ST-' + String(n).padStart(3, '0');
    return p.code;
  }

  function staffCodeOf(p) {
    return p.code || p.id;
  }

  function nextStaffCode() {
    const codes = state.staff
      .map((p) => p.code || '')
      .map((c) => {
        const m = /^ST-(\d+)$/i.exec(c);
        return m ? Number(m[1]) : 0;
      });
    const max = codes.length ? Math.max(0, ...codes) : 0;
    return 'ST-' + String(max + 1).padStart(3, '0');
  }

  function staffMgmtFormHtml(p) {
    const isEdit = !!p;
    const atts = (p?.attachments || [])
      .map((a, i) => `<div class="s" style="margin-top:4px">${escAttr(a.name)} <button type="button" class="link-btn" data-rm-att="${i}">remove</button></div>`)
      .join('');
    return `<div class="form-grid cols-2">
      <p style="grid-column:1/-1;margin:0;color:var(--muted);font-size:.85rem">Staff profile for <strong>${activeQuarry().name}</strong>${
        isEdit ? ' · code <span style="font-family:var(--num)">' + escAttr(staffCodeOf(p)) + '</span>' : ''
      }.</p>
      <label class="field"><span>Full name *</span><input id="smName" value="${escAttr(p?.name || '')}" placeholder="Full name" autofocus /></label>
      <label class="field"><span>Staff code</span><input id="smCode" value="${escAttr(p?.code || (isEdit ? '' : nextStaffCode()))}" placeholder="ST-001" /></label>
      <label class="field"><span>Role / designation *</span><input id="smRole" value="${escAttr(p?.designation || '')}" placeholder="e.g. Crane Op, Incharge" /></label>
      <label class="field"><span>Join date</span><input type="date" id="smJoin" value="${escAttr(p?.joinDate || today())}" /></label>
      <label class="field"><span>Monthly basic</span><input type="number" id="smBasic" value="${p?.basic || 0}" min="0" /></label>
      <label class="field"><span>Phone</span><input id="smPhone" type="tel" value="${escAttr(p?.phone || '')}" placeholder="10-digit mobile" /></label>
      <label class="field"><span>Email</span><input id="smEmail" type="email" value="${escAttr(p?.email || '')}" placeholder="Optional" /></label>
      <label class="field"><span>Aadhaar</span><input id="smAadhaar" value="${escAttr(p?.aadhaar || '')}" placeholder="XXXX XXXX XXXX" /></label>
      <label class="field"><span>PAN</span><input id="smPan" value="${escAttr(p?.pan || '')}" placeholder="ABCDE1234F" /></label>
      <label class="field" style="grid-column:1/-1"><span>Address</span>
        <textarea id="smAddress" rows="2" placeholder="House / village / city">${escAttr(p?.address || '')}</textarea>
      </label>
      <label class="field"><span>Bank name</span><input id="smBank" value="${escAttr(p?.bankName || '')}" placeholder="CUB / TMB Melur" /></label>
      <label class="field"><span>A/c number</span><input id="smAc" value="${escAttr(p?.bankAc || '')}" placeholder="Account no" /></label>
      <label class="field"><span>IFSC</span><input id="smIfsc" value="${escAttr(p?.ifsc || '')}" placeholder="CIUB0000123" /></label>
      <label class="field"><span>Emergency phone</span><input id="smEmerg" type="tel" value="${escAttr(p?.emergencyPhone || '')}" placeholder="Optional" /></label>
      <label class="field"><span>Photo</span><input type="file" id="smPhoto" accept="image/*" /></label>
      <label class="field"><span>Attachment</span><input type="file" id="smAttach" accept="image/*,.pdf,.doc,.docx" /></label>
      ${p?.photo ? `<div style="grid-column:1/-1"><img src="${p.photo}" alt="" style="max-height:72px;border-radius:8px;border:1px solid var(--line)" /></div>` : ''}
      <div id="smAttList" style="grid-column:1/-1">${atts || '<span class="s" style="color:var(--muted)">No attachments</span>'}</div>
      <label class="field" style="grid-column:1/-1"><span>Notes</span>
        <textarea id="smNotes" rows="2" placeholder="Blood group, other">${escAttr(p?.notes || '')}</textarea>
      </label>
    </div>`;
  }

  function readFileAsDataUrl(file, maxBytes = 350000) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      if (file.size > maxBytes) {
        reject(new Error('File too large (max ~350KB for prototype storage)'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  function collectStaffMgmtForm(existing, extras = {}) {
    const name = ($('#smName')?.value || '').trim();
    if (!name) {
      toast('Name required');
      return null;
    }
    const role = ($('#smRole')?.value || '').trim();
    if (!role) {
      toast('Role / designation required');
      return null;
    }
    const join = $('#smJoin')?.value || today();
    const code = ($('#smCode')?.value || '').trim() || (existing?.code || nextStaffCode());
    const patch = {
      name,
      code,
      designation: role,
      category: 'Staff',
      basic: Number($('#smBasic')?.value) || 0,
      dailyRate: 0,
      joinDate: join,
      phone: ($('#smPhone')?.value || '').trim(),
      email: ($('#smEmail')?.value || '').trim(),
      aadhaar: ($('#smAadhaar')?.value || '').trim(),
      pan: ($('#smPan')?.value || '').trim().toUpperCase(),
      address: ($('#smAddress')?.value || '').trim(),
      bankName: ($('#smBank')?.value || '').trim(),
      bankAc: ($('#smAc')?.value || '').trim(),
      ifsc: ($('#smIfsc')?.value || '').trim(),
      emergencyPhone: ($('#smEmerg')?.value || '').trim(),
      notes: ($('#smNotes')?.value || '').trim(),
      quarryId: existing?.quarryId || state.activeQuarryId,
      photo: extras.photo !== undefined ? extras.photo : existing?.photo || '',
      attachments: extras.attachments || existing?.attachments || [],
    };
    return patch;
  }

  function openStaffMgmtForm(personId) {
    const existing = personId
      ? state.staff.find((p) => p.id === personId && (p.category || 'Staff') === 'Staff')
      : null;
    if (personId && !existing) {
      toast('Staff Management is for Staff only');
      return;
    }
    let workingAtts = [...(existing?.attachments || [])];
    let workingPhoto = existing?.photo || '';
    openModal(
      existing ? 'Edit staff — ' + existing.name : 'Add staff — ' + activeQuarry().name,
      staffMgmtFormHtml(existing),
      () => {
        const patch = collectStaffMgmtForm(existing, { photo: workingPhoto, attachments: workingAtts });
        if (!patch) return false;
        if (existing) {
          Object.assign(existing, patch);
          toast('Profile updated · ' + existing.name);
          selectedStaffMgmtId = existing.id;
        } else {
          const person = {
            id: uid(),
            ...patch,
            exitDate: null,
            exitReason: '',
            employment: [{ kind: 'Join', date: patch.joinDate, note: 'Added via Staff Management' }],
          };
          state.staff.push(person);
          selectedStaffMgmtId = person.id;
          toast('Staff added · ' + person.name);
        }
        return true;
      },
      {
        large: true,
        onAfterSave: () => {
          if (selectedStaffMgmtId) go('staff', { staffId: selectedStaffMgmtId });
          else go('staffmgmt');
        },
      }
    );
    const refreshAttList = () => {
      if (!$('#smAttList')) return;
      $('#smAttList').innerHTML = workingAtts.length
        ? workingAtts
            .map(
              (a, i) =>
                `<div class="s" style="margin-top:4px">${escAttr(a.name)} <button type="button" class="link-btn" data-rm-att="${i}">remove</button></div>`
            )
            .join('')
        : '<span class="s" style="color:var(--muted)">No attachments</span>';
      $$('#smAttList [data-rm-att]').forEach((b) =>
        b.addEventListener('click', () => {
          workingAtts.splice(Number(b.dataset.rmAtt), 1);
          refreshAttList();
        })
      );
    };
    refreshAttList();
    $('#smPhoto')?.addEventListener('change', async () => {
      try {
        const file = $('#smPhoto').files?.[0];
        workingPhoto = (await readFileAsDataUrl(file)) || workingPhoto;
        toast('Photo ready — Save to apply');
      } catch (e) {
        toast(e.message || 'Photo failed');
      }
    });
    $('#smAttach')?.addEventListener('change', async () => {
      try {
        const file = $('#smAttach').files?.[0];
        if (!file) return;
        const dataUrl = await readFileAsDataUrl(file);
        workingAtts.push({ name: file.name, dataUrl });
        refreshAttList();
        toast('Attachment added — Save to apply');
      } catch (e) {
        toast(e.message || 'Attach failed');
      }
    });
  }

  function openStaffMgmtOtherTxn(personId) {
    const p = state.staff.find((x) => x.id === personId);
    if (!p) return;
    const heads = (state.heads || []).filter((h) => !['Salary', 'Salary Advance', 'Labour Advance', 'Labour Wage'].includes(h));
    openModal(
      'Other payment — ' + p.name,
      `<div class="form-grid cols-2">
        <label class="field"><span>Date</span><input type="date" id="smOtDate" value="${today()}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="smOtAmt" min="1" step="1" placeholder="e.g. 500" /></label>
        <label class="field"><span>Head</span>
          <select id="smOtHead">${(heads.length ? heads : ['Other', 'Medical', 'Pooja', 'Transport'])
            .map((h) => `<option value="${h}">${h}</option>`)
            .join('')}</select>
        </label>
        <label class="field"><span>Type</span>
          <select id="smOtType"><option value="Debit">Paid to him (Debit)</option><option value="Credit">Received / reverse (Credit)</option></select>
        </label>
        <label class="field" style="grid-column:1/-1"><span>Particulars</span>
          <input id="smOtNote" placeholder="${p.name} — medical / travel / other" value="${p.name} " />
        </label>
      </div>`,
      () => {
        const amt = Number($('#smOtAmt').value);
        const date = $('#smOtDate').value || today();
        if (!amt) {
          toast('Amount required');
          return false;
        }
        const typ = $('#smOtType').value || 'Debit';
        state.expenses.push({
          id: uid(),
          quarryId: state.activeQuarryId,
          date,
          type: typ,
          head: $('#smOtHead').value || 'Other',
          particulars: ($('#smOtNote').value || '').trim() || `${p.name} Other`,
          debit: typ === 'Debit' ? amt : 0,
          credit: typ === 'Credit' ? amt : 0,
          personId: p.id,
        });
        toast('Saved ' + money(amt) + ' → ' + p.name);
        return true;
      },
      { onAfterSave: () => go('staff', { staffId: p.id }) }
    );
  }

  function openStaffMgmtPaySalary(personId) {
    const s = state.staff.find((x) => x.id === personId);
    if (!s) return;
    const ymOpts = recentMonths(18);
    const defaultYm = staffDetailTxnYm || ymOpts[0];
    openModal(
      'Pay salary — ' + s.name,
      `<div class="form-grid cols-2">
        <label class="field"><span>Month</span>
          <select id="smPayYm">${ymOpts.map((v) => `<option value="${v}" ${v === defaultYm ? 'selected' : ''}>${monthLabel(v)}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Pay date</span><input type="date" id="salPayDate" value="${today()}" /></label>
        <label class="field"><span>Mode</span>
          <select id="salPayMode"><option value="Cash">Cash</option><option value="Bank">Bank transfer</option></select>
        </label>
        <label class="field" style="grid-column:1/-1"><span>Note</span>
          <input id="salPayNote" placeholder="optional" />
        </label>
        <p id="smPayPreview" style="grid-column:1/-1;color:var(--muted);font-size:.9rem;margin:0"></p>
      </div>`,
      () => {
        const ym = $('#smPayYm').value || defaultYm;
        const dim = daysInMonth(ym);
        const row = salaryRow(s, ym, dim);
        if (row.paid) {
          toast('Already paid on ' + row.paid.date);
          return false;
        }
        if (row.net <= 0) {
          toast('Net is ₹0 — nothing to mark paid');
          return false;
        }
        const r = postSalaryPayment(s, ym, dim, {
          date: $('#salPayDate').value || today(),
          mode: $('#salPayMode').value,
          note: ($('#salPayNote').value || '').trim(),
        });
        if (!r.ok) {
          toast(r.msg);
          return false;
        }
        toast('Paid ' + money(r.amount) + ' → ' + s.name);
        return true;
      },
      { onAfterSave: () => go('staff', { staffId: s.id }) }
    );
    const paintPreview = () => {
      const ym = $('#smPayYm')?.value || defaultYm;
      const dim = daysInMonth(ym);
      const row = salaryRow(s, ym, dim);
      if ($('#smPayPreview')) {
        $('#smPayPreview').innerHTML = row.paid
          ? `Already paid on ${row.paid.date} via ${row.paid.mode}`
          : `${ym} · Days ${row.days} · Earned ${money(row.earned)} − Adv ${money(row.adv)} = <strong style="color:var(--text)">${money(row.net)}</strong>`;
      }
    };
    $('#smPayYm')?.addEventListener('change', paintPreview);
    paintPreview();
  }

  function deleteStaffPerson(personId) {
    const p = state.staff.find((x) => x.id === personId);
    if (!p) return;
    openModal(
      'Delete staff — ' + p.name,
      `<div class="form-grid">
        <p style="margin:0;color:var(--muted);font-size:.9rem">This removes <strong>${p.name}</strong> (${staffCodeOf(p)}) from Staff Management. Linked expenses stay in books but lose the person link. Prefer <strong>Exit</strong> if they left the quarry.</p>
        <label class="field"><span>Type DELETE to confirm</span><input id="smDelConfirm" placeholder="DELETE" autocomplete="off" /></label>
      </div>`,
      () => {
        if (($('#smDelConfirm')?.value || '').trim() !== 'DELETE') {
          toast('Type DELETE to confirm');
          return false;
        }
        state.staff = state.staff.filter((x) => x.id !== personId);
        selectedStaffMgmtId = null;
        toast('Deleted · ' + p.name);
        return true;
      },
      { onAfterSave: () => go('staffmgmt') }
    );
  }

  function exportStaffMgmtList() {
    const list = staffMgmtFilteredList();
    downloadCsv(`staff-${activeQuarry().code}.csv`, [
      ['Code', 'Name', 'Role', 'Phone', 'Email', 'Aadhaar', 'PAN', 'Pay', 'Join', 'Exit', 'Status', 'Balance', 'Bank', 'A/c', 'IFSC'],
      ...list.map((p) => {
        const bal = staffLedgerBalance(p.id);
        return [
          staffCodeOf(p),
          p.name,
          p.designation || '',
          p.phone || '',
          p.email || '',
          p.aadhaar || '',
          p.pan || '',
          rateLabel(p),
          p.joinDate || '',
          p.exitDate || '',
          personStatus(p),
          bal,
          p.bankName || '',
          p.bankAc || '',
          p.ifsc || '',
        ];
      }),
    ]);
    toast('Staff list exported');
  }

  function exportStaffDetailLedger(kind) {
    const person = selectedStaffMgmtId
      ? state.staff.find((p) => p.id === selectedStaffMgmtId)
      : null;
    if (!person) {
      toast('Open a staff profile first');
      return;
    }
    let rows = staffLedgerTxns(person.id);
    if (staffDetailTxnScope === 'month') {
      const ym = staffDetailTxnYm || recentMonths(1)[0];
      rows = rows.filter((t) => t.date && t.date.startsWith(ym));
    }
    if (kind === 'excel') {
      downloadCsv(
        `staff-ledger-${staffCodeOf(person)}-${activeQuarry().code}.csv`,
        [
          ['Type', 'Date', 'Particulars', 'Head', 'Debit', 'Credit', 'Balance'],
          ...rows.map((t) => [t.type, t.date, t.particulars, t.head, t.debit, t.credit, t.money ? t.balance : '']),
        ]
      );
      toast('Excel downloaded');
      return;
    }
    const body = rows
      .map(
        (t) => `<tr>
          <td>${t.type}</td><td>${t.date}</td><td>${t.particulars}</td>
          <td class="num">${t.debit || '—'}</td><td class="num">${t.credit || '—'}</td>
          <td class="num">${t.money ? t.balance : '—'}</td>
        </tr>`
      )
      .join('');
    printReport(
      `Staff ledger · ${person.name} (${staffCodeOf(person)})`,
      `<table><thead><tr><th>Type</th><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>${body}</tbody></table>`
    );
  }

  function staffMgmtFilteredList() {
    const q = ($('#staffMgmtSearch')?.value || '').toLowerCase().trim();
    const filter = $('#staffMgmtFilter')?.value || 'all';
    const sort = $('#staffMgmtSort')?.value || staffMgmtSort || 'name';
    staffMgmtSort = sort;
    const thisMonth = today().slice(0, 7);
    let list = state.staff.filter(
      (p) => p.quarryId === state.activeQuarryId && (p.category || 'Staff') === 'Staff'
    );
    let codesAssigned = false;
    list.forEach((p) => {
      if (!p.code) {
        ensureStaffCode(p);
        codesAssigned = true;
      }
    });
    if (codesAssigned) save(state);
    if (filter === 'Active') list = list.filter((p) => !p.exitDate);
    if (filter === 'Left') list = list.filter((p) => !!p.exitDate);
    if (filter === 'Pending') list = list.filter((p) => staffLedgerBalance(p.id) > 0);
    if (filter === 'LeftMonth') list = list.filter((p) => p.exitDate && p.exitDate.startsWith(thisMonth));
    if (q) {
      list = list.filter((p) =>
        `${p.code || ''} ${p.name} ${p.designation || ''} ${p.phone || ''} ${p.email || ''} ${p.aadhaar || ''} ${p.pan || ''} ${p.bankName || ''} ${p.notes || ''}`
          .toLowerCase()
          .includes(q)
      );
    }
    list.sort((a, b) => {
      if (sort === 'code') return staffCodeOf(a).localeCompare(staffCodeOf(b));
      if (sort === 'join-desc') return (b.joinDate || '').localeCompare(a.joinDate || '');
      if (sort === 'bal-desc') return staffLedgerBalance(b.id) - staffLedgerBalance(a.id);
      if (sort === 'pay-desc') return (Number(b.basic) || 0) - (Number(a.basic) || 0);
      if (sort === 'status') return (a.exitDate ? 1 : 0) - (b.exitDate ? 1 : 0) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    return list;
  }

  function renderStaffMgmt() {
    const list = staffMgmtFilteredList();
    const activeN = list.filter((p) => !p.exitDate).length;
    const leftN = list.filter((p) => !!p.exitDate).length;
    const pendingN = list.filter((p) => staffLedgerBalance(p.id) > 0).length;
    if ($('#staffMgmtStats')) {
      $('#staffMgmtStats').innerHTML = `
        <div class="card"><h3>Total</h3><div class="stat">${list.length}</div><div class="hint">${activeQuarry().name}</div></div>
        <div class="card"><h3>Active</h3><div class="stat ok">${activeN}</div></div>
        <div class="card"><h3>Left</h3><div class="stat ${leftN ? 'danger' : ''}">${leftN}</div></div>
        <div class="card"><h3>Pending adv</h3><div class="stat ${pendingN ? 'warn' : ''}">${pendingN}</div></div>`;
    }
    const page = slicePage(list, 'staffmgmt', '#staffMgmtPageSize');
    const cell = (v) => (v ? String(v) : '—');
    if ($('#staffMgmtTable')) {
      $('#staffMgmtTable').innerHTML = page.rows.length
        ? page.rows
            .map((p) => {
              const st = personStatus(p);
              const bal = staffLedgerBalance(p.id);
              return `<tr data-sm-row="${p.id}" style="cursor:pointer">
                <td style="font-family:var(--num);font-size:.82rem">${staffCodeOf(p)}</td>
                <td><strong>${p.name}</strong></td>
                <td>${cell(p.designation)}</td>
                <td>${cell(p.phone)}</td>
                <td class="num">${rateLabel(p)}</td>
                <td><span class="badge ${st === 'Active' ? 'ok' : 'danger'}">${st}</span></td>
                <td class="num ${bal > 0 ? 'neg' : bal < 0 ? 'pos' : ''}">${
                  bal ? `${money(Math.abs(bal))} ${bal > 0 ? 'Dr' : 'Cr'}` : '—'
                }</td>
                <td><button type="button" class="btn btn-ghost btn-sm" data-sm-edit="${p.id}">Edit</button></td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="8"><div class="empty">No staff for this filter</div></td></tr>`;
      $$('#staffMgmtTable [data-sm-row]').forEach((tr) =>
        tr.addEventListener('click', (e) => {
          if (e.target.closest('[data-sm-edit]')) return;
          go('staff', { staffId: tr.dataset.smRow });
        })
      );
      $$('#staffMgmtTable [data-sm-edit]').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          openStaffMgmtForm(b.dataset.smEdit);
        })
      );
    }
    renderPager($('#staffMgmtPager'), 'staffmgmt', page, renderStaffMgmt);
    renderLabourGangs();
    syncStaffMgmtTabUi();
  }

  let staffMgmtTab = 'staff';

  function syncStaffMgmtTabUi() {
    const tab = staffMgmtTab || 'staff';
    $$('#staffMgmtTabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.smtab === tab));
    $$('.smtab').forEach((p) => {
      p.style.display = p.id === 'smtab-' + tab ? 'block' : 'none';
    });
    if ($('#staffMgmtHeadActions')) {
      $('#staffMgmtHeadActions').style.display = tab === 'staff' ? 'flex' : 'none';
    }
    if ($('#staffMgmtGangActions')) {
      $('#staffMgmtGangActions').style.display = tab === 'gangs' ? 'flex' : 'none';
    }
  }

  function renderStaffDetail() {
    const person = selectedStaffMgmtId
      ? state.staff.find((p) => p.id === selectedStaffMgmtId && (p.category || 'Staff') === 'Staff')
      : null;
    if (!person) {
      go('staffmgmt');
      return;
    }
    if (!person.code) ensureStaffCode(person);
    const st = personStatus(person);
    const bal = staffLedgerBalance(person.id);
    if ($('#staffDetailTitle')) $('#staffDetailTitle').textContent = person.name;
    if ($('#staffDetailSub')) {
      $('#staffDetailSub').innerHTML = `<span style="font-family:var(--num)">${staffCodeOf(person)}</span> · ${
        person.designation || '—'
      } · ${st}${person.phone ? ' · ' + person.phone : ''}`;
    }
    if ($('#staffDetailBal')) {
      $('#staffDetailBal').innerHTML = `
        <small>Advance − Salary</small>
        <strong class="${bal > 0 ? 'neg' : bal < 0 ? 'pos' : ''}">${money(Math.abs(bal))} ${bal > 0 ? 'Dr' : bal < 0 ? 'Cr' : ''}</strong>`;
    }
    if ($('#staffDetailExitBtn')) $('#staffDetailExitBtn').style.display = person.exitDate ? 'none' : '';
    if ($('#staffDetailRejoinBtn')) $('#staffDetailRejoinBtn').style.display = person.exitDate ? '' : 'none';

    if ($('#staffDetailProfile')) {
      const initials = (person.name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
      const row = (label, v, wide) =>
        `<div class="staff-row${wide ? ' wide' : ''}"><dt>${label}</dt><dd${v ? '' : ' class="empty"'}>${v || '—'}</dd></div>`;
      const exitTxt = person.exitDate
        ? person.exitDate + (person.exitReason ? ' · ' + person.exitReason : '')
        : '';
      const expanded = staffProfileExpanded;
      const photoHtml = person.photo
        ? `<img class="staff-avatar-img" src="${person.photo}" alt="" />`
        : `<div class="staff-avatar" aria-hidden="true">${initials}</div>`;
      const attLinks = (person.attachments || [])
        .map(
          (a) =>
            `<a class="link-btn" href="${a.dataUrl}" download="${escAttr(a.name)}" style="margin-right:8px">${escAttr(a.name)}</a>`
        )
        .join('');
      $('#staffDetailProfile').innerHTML = `
        <div class="staff-profile">
          <div class="staff-profile-hero">
            ${photoHtml}
            <div class="staff-profile-hero-main">
              <h3>${person.name}</h3>
              <div class="staff-profile-meta">
                <span class="badge ok">Staff</span>
                <span class="badge ${st === 'Active' ? 'ok' : 'danger'}">${st}</span>
                <span style="font-family:var(--num);font-size:.8rem;color:var(--muted)">${staffCodeOf(person)}</span>
                ${person.designation ? `<span style="color:var(--muted);font-size:.8rem">${person.designation}</span>` : ''}
              </div>
            </div>
            <div class="staff-profile-pay">
              <small>Monthly basic</small>
              <strong>${rateLabel(person)}</strong>
            </div>
          </div>
          <dl class="staff-profile-dl">
            ${row('Phone', person.phone)}
            ${row('Role', person.designation)}
            ${row('Join', person.joinDate)}
            ${
              expanded
                ? `${row('Email', person.email)}
            ${row('Emergency', person.emergencyPhone)}
            ${row('Exit', exitTxt)}
            ${row('Aadhaar', person.aadhaar)}
            ${row('PAN', person.pan)}
            ${row('Bank', person.bankName)}
            ${row('A/c', person.bankAc)}
            ${row('IFSC', person.ifsc)}
            ${row('Address', person.address, true)}
            ${row('Notes', person.notes, true)}
            ${row('Files', attLinks || '—', true)}`
                : ''
            }
          </dl>
          <div class="staff-profile-toggle-wrap">
            <button type="button" class="btn btn-ghost btn-sm" id="staffProfileToggle">
              ${expanded ? 'Hide full details' : 'See full details'}
            </button>
          </div>
        </div>`;
      $('#staffProfileToggle')?.addEventListener('click', () => {
        staffProfileExpanded = !staffProfileExpanded;
        renderStaffDetail();
      });
    }

    const paintTimeline = () => {
      const emp = ensureEmploymentHistory(person);
      if (!$('#staffDetailTimeline')) return;
      if (!emp.length) {
        $('#staffDetailTimeline').innerHTML = `<div class="empty">No employment events yet</div>`;
        return;
      }
      $('#staffDetailTimeline').innerHTML = `
        <div class="staff-att-shell">
          <div class="staff-att-shell-head">
            <strong>Employment timeline</strong>
            <span>${emp.length} event${emp.length === 1 ? '' : 's'}</span>
          </div>
          <div class="staff-timeline" style="padding:10px 12px 12px">${emp
            .slice()
            .reverse()
            .map(
              (ev) => `<div class="staff-timeline-item ${ev.kind}">
                <span class="badge ${ev.kind === 'Exit' ? 'danger' : ev.kind === 'Rejoin' ? 'warn' : 'ok'}">${ev.kind}</span>
                <strong>${ev.date}</strong>
                <span>${ev.note || ''}</span>
              </div>`
            )
            .join('')}</div>
        </div>`;
    };

    const allTxns = staffLedgerTxns(person.id);
    const badgeClass = (type) => {
      if (type === 'Salary' || type === 'Join' || type === 'Rejoin') return 'ok';
      if (type === 'Advance' || type === 'Exit') return 'danger';
      if (type === 'Other') return 'warn';
      return '';
    };

    const ensureStaffTxnMonth = () => {
      const sel = $('#staffDetailTxnMonth');
      const opts = recentMonths(18);
      if (sel && !sel.dataset.filled) {
        sel.innerHTML = opts.map((v) => `<option value="${v}">${monthLabel(v)}</option>`).join('');
        sel.dataset.filled = '1';
      }
      if (!staffDetailTxnYm || !opts.includes(staffDetailTxnYm)) staffDetailTxnYm = opts[0];
      if (sel && sel.value !== staffDetailTxnYm) sel.value = staffDetailTxnYm;
      return staffDetailTxnYm;
    };

    const filteredMoneyTxns = () => {
      let rows = allTxns.filter((t) => t.money);
      if (staffDetailTxnScope === 'month') {
        const ym = ensureStaffTxnMonth();
        rows = rows.filter((t) => t.date && t.date.startsWith(ym));
      }
      return rows;
    };

    const monthScopedPending = (rows) => rows.reduce((a, t) => a + (Number(t.signed) || 0), 0);

    const paintTxnStats = () => {
      const rows = filteredMoneyTxns();
      const salary = rows.filter((t) => t.type === 'Salary').reduce((a, t) => a + (Number(t.credit) || 0), 0);
      const advance = rows.filter((t) => t.type === 'Advance').reduce((a, t) => a + (Number(t.debit) || 0), 0);
      const other = rows
        .filter((t) => t.type === 'Other')
        .reduce((a, t) => a + (Number(t.debit) || 0) - (Number(t.credit) || 0), 0);
      const spend = salary + advance + Math.max(0, other);
      const pending = staffDetailTxnScope === 'month' ? monthScopedPending(rows) : bal;
      const periodHint =
        staffDetailTxnScope === 'month' ? monthLabel(ensureStaffTxnMonth()) : 'All time';
      if ($('#staffDetailTxnStats')) {
        $('#staffDetailTxnStats').innerHTML = `
          <div class="card"><h3>Salary paid</h3><div class="stat ok">${money(salary)}</div><div class="hint">${periodHint}</div></div>
          <div class="card"><h3>Advances</h3><div class="stat ${advance ? 'warn' : ''}">${money(advance)}</div><div class="hint">${periodHint}</div></div>
          <div class="card"><h3>Other</h3><div class="stat">${money(Math.abs(other))}${other < 0 ? ' Cr' : other > 0 ? ' Dr' : ''}</div><div class="hint">${periodHint}</div></div>
          <div class="card"><h3>Total spend</h3><div class="stat">${money(spend)}</div><div class="hint">Pending ${
            pending
              ? `${money(Math.abs(pending))} ${pending > 0 ? 'Dr' : 'Cr'}`
              : '—'
          } · ${periodHint}</div></div>`;
      }
    };

    const paintTxns = () => {
      if ($('#staffDetailTxnScope')) $('#staffDetailTxnScope').value = staffDetailTxnScope;
      if ($('#staffDetailTxnType')) {
        const allowed = ['all', 'Salary', 'Advance', 'Other'];
        if (!allowed.includes(staffDetailTxnType)) staffDetailTxnType = 'all';
        const sel = $('#staffDetailTxnType');
        if (!sel.dataset.fixedTypes) {
          sel.innerHTML = `
            <option value="all">All types</option>
            <option value="Salary">Salary</option>
            <option value="Advance">Advance</option>
            <option value="Other">Other</option>`;
          sel.dataset.fixedTypes = '1';
        }
        sel.value = staffDetailTxnType;
      }
      if ($('#staffDetailTxnMonth')) {
        ensureStaffTxnMonth();
        $('#staffDetailTxnMonth').style.display = staffDetailTxnScope === 'month' ? '' : 'none';
      }
      paintTxnStats();
      const tq = ($('#staffDetailTxnSearch')?.value || '').toLowerCase().trim();
      let rows = allTxns.slice().reverse();
      if (staffDetailTxnScope === 'month') {
        const ym = ensureStaffTxnMonth();
        rows = rows.filter((t) => t.date && t.date.startsWith(ym));
      }
      if (staffDetailTxnType !== 'all') {
        rows = rows.filter((t) => t.type === staffDetailTxnType);
      }
      if (tq) {
        rows = rows.filter((t) =>
          `${t.type} ${t.particulars} ${t.head} ${t.date}`.toLowerCase().includes(tq)
        );
      }
      if (!$('#staffDetailTxnTable')) return;
      $('#staffDetailTxnTable').innerHTML = rows.length
        ? rows
            .map(
              (t) => `<tr>
                <td><span class="badge ${badgeClass(t.type)}">${t.type}</span></td>
                <td>${t.date}</td>
                <td>${t.particulars}<div class="s" style="color:var(--muted);font-size:.72rem">${t.head}</div></td>
                <td class="num">${t.debit ? money(t.debit) : '—'}</td>
                <td class="num">${t.credit ? money(t.credit) : '—'}</td>
                <td class="num ${t.money ? (t.balance > 0 ? 'neg' : t.balance < 0 ? 'pos' : '') : ''}">${
                  t.money
                    ? `${money(Math.abs(t.balance))} ${t.balance > 0 ? 'Dr' : t.balance < 0 ? 'Cr' : ''}`
                    : '—'
                }</td>
              </tr>`
            )
            .join('')
        : `<tr><td colspan="6"><div class="empty">No transactions for this filter</div></td></tr>`;
    };

    const showTab = (tab) => {
      if (tab === 'att') tab = 'txns';
      staffDetailTab = tab;
      $$('#staffDetailTabs .party-tab').forEach((t) => t.classList.toggle('active', t.dataset.sdt === tab));
      if ($('#staffDetailTabTxns')) $('#staffDetailTabTxns').style.display = tab === 'txns' ? '' : 'none';
      if ($('#staffDetailTabTimeline')) $('#staffDetailTabTimeline').style.display = tab === 'timeline' ? '' : 'none';
      if ($('#staffDetailTxnTools')) $('#staffDetailTxnTools').style.display = tab === 'txns' ? '' : 'none';
      if (tab === 'txns') paintTxns();
      else paintTimeline();
    };

    showTab(staffDetailTab);
  }

  function staffAttMonthKey() {
    return $('#staffAttMonth')?.value || staffAttYm || recentMonths(1)[0];
  }

  function ensureStaffAttMonthOptions() {
    const sel = $('#staffAttMonth');
    const opts = recentMonths(24);
    if (sel) {
      const curVal = staffAttYm || sel.value;
      // Keep room to navigate past the default window
      const extra = [];
      if (curVal && !opts.includes(curVal)) extra.push(curVal);
      const all = [...extra, ...opts];
      if (!sel.dataset.filled || sel.options.length !== all.length) {
        sel.innerHTML = all.map((v) => `<option value="${v}">${monthLabel(v)}</option>`).join('');
        sel.dataset.filled = '1';
      }
      if (!staffAttYm || !all.includes(staffAttYm)) staffAttYm = all.includes(opts[0]) ? opts[0] : all[0];
      if (sel.value !== staffAttYm) sel.value = staffAttYm;
    } else if (!staffAttYm) {
      staffAttYm = opts[0];
    }
    if ($('#staffAttMonthLabel')) $('#staffAttMonthLabel').textContent = monthLabel(staffAttYm);
    return staffAttYm;
  }

  function shiftYm(ym, deltaMonths) {
    const [y, m] = (ym || recentMonths(1)[0]).split('-').map(Number);
    const d = new Date(y, m - 1 + deltaMonths, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function shiftDate(dateStr, deltaDays) {
    const d = new Date((dateStr || today()) + 'T12:00:00');
    d.setDate(d.getDate() + deltaDays);
    return d.toISOString().slice(0, 10);
  }

  function goStaffAttMonth(delta) {
    const cur = ensureStaffAttMonthOptions();
    staffAttYm = shiftYm(cur, delta);
    const sel = $('#staffAttMonth');
    if (sel && ![...sel.options].some((o) => o.value === staffAttYm)) {
      const opt = new Option(monthLabel(staffAttYm), staffAttYm);
      if (delta < 0) sel.insertBefore(opt, sel.firstChild);
      else sel.appendChild(opt);
    }
    if (sel) sel.value = staffAttYm;
    if ($('#staffAttMonthLabel')) $('#staffAttMonthLabel').textContent = monthLabel(staffAttYm);
    renderStaffAtt();
  }

  function goStaffAttDay(delta) {
    staffAttDate = shiftDate(ensureStaffAttDate(), delta);
    staffAttYm = staffAttDate.slice(0, 7);
    if ($('#staffAttDate')) $('#staffAttDate').value = staffAttDate;
    renderStaffAtt();
  }

  function ensureStaffAttDate() {
    const inp = $('#staffAttDate');
    if (!staffAttDate) staffAttDate = today();
    if (inp && inp.value !== staffAttDate) inp.value = staffAttDate;
    return staffAttDate;
  }

  function parseStaffAttDate(dateStr) {
    const d = dateStr || ensureStaffAttDate();
    const ym = d.slice(0, 7);
    const day = Number(d.slice(8, 10));
    return { date: d, ym, day };
  }

  function nextStaffAttValue(cur) {
    if (cur.mark === 'X') return 'A';
    if (cur.mark === 'A') return 'H';
    if (cur.mark === 'H') return 'L';
    if (cur.mark === 'L') return formatOtMark(cur.otHours > 0 ? cur.otHours : 4);
    return 'X'; // O → back to Present
  }

  function cycleStaffSectionAtt(personId, day, ym, opts = {}) {
    const cur = parseAtt(getAtt(personId, day, ym));
    // Right-click / alt-click on OT (or Leave) opens hours editor
    if (opts.editOt || ((cur.mark === 'O' || cur.mark === 'L') && opts.alt)) {
      openOtHoursModal(personId, day, cur.mark === 'O' ? cur.otHours : 4, ym);
      return;
    }
    setAtt(personId, day, nextStaffAttValue(cur), ym);
    save(state);
    renderStaffAtt();
  }

  function staffAttPeople(forDateOrYm) {
    const q = ($('#staffAttSearch')?.value || '').toLowerCase().trim();
    const scope = forDateOrYm || '';
    let list = state.staff.filter((p) => {
      if (p.quarryId !== state.activeQuarryId) return false;
      if ((p.category || 'Staff') !== 'Staff') return false;
      if (!scope) return true;
      if (/^\d{4}-\d{2}-\d{2}$/.test(scope)) {
        // Daily: only if employed on that date
        const join = p.joinDate || '2000-01-01';
        if (join > scope) return false;
        if (p.exitDate && p.exitDate < scope) return false;
        return true;
      }
      // Monthly: active sometime in that month
      return isActiveInMonth(p, scope);
    });
    list.forEach((p) => {
      if (!p.code) ensureStaffCode(p);
    });
    if (q) {
      list = list.filter((p) =>
        `${p.code || ''} ${p.name} ${p.designation || ''} ${p.phone || ''}`.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) => (a.exitDate ? 1 : 0) - (b.exitDate ? 1 : 0) || a.name.localeCompare(b.name)
    );
  }

  function staffAttGangs(forDateOrYm) {
    const q = ($('#staffAttSearch')?.value || '').toLowerCase().trim();
    const scope = forDateOrYm || monthKey();
    const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(scope) ? scope : `${scope}-01`;
    const fy = fyFromDate(dateStr);
    let list = quarryLabour(fy);
    if (q) list = list.filter((l) => `${l.name} ${l.fy || ''}`.toLowerCase().includes(q));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  function syncStaffAttViewUi() {
    $$('#staffAttViewTabs .party-tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.saview === staffAttView)
    );
    $$('#staffAttScopeTabs .tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.sascope === staffAttScope)
    );
    if ($('#staffAttDayWrap')) $('#staffAttDayWrap').style.display = staffAttView === 'day' ? '' : 'none';
    if ($('#staffAttMonthWrap')) $('#staffAttMonthWrap').style.display = staffAttView === 'month' ? '' : 'none';
    const isGang = staffAttScope === 'gangs';
    if ($('#staffAttSub')) {
      $('#staffAttSub').innerHTML = isGang
        ? 'Contract group headcount for the selected day / month.'
        : 'Attendance for <strong>all staff</strong> employed on the selected day / month. Left staff drop off after exit date.';
    }
    if ($('#staffAttPanelTitle')) {
      const who = isGang ? 'Contract group' : 'Staff';
      $('#staffAttPanelTitle').textContent =
        staffAttView === 'day' ? `${who} · Daily` : `${who} · Monthly`;
    }
    if ($('#staffAttSearch')) {
      $('#staffAttSearch').placeholder = isGang ? 'Search gang…' : 'Search staff…';
    }
  }

  function renderStaffAttDaily() {
    const { date, ym, day } = parseStaffAttDate();
    const people = staffAttPeople(date);
    let present = 0,
      half = 0,
      leave = 0,
      absent = 0,
      ot = 0;
    const rows = people.map((s) => {
      const v = getAtt(s.id, day, ym);
      const p = parseAtt(v);
      if (p.mark === 'X') present += 1;
      else if (p.mark === 'H') half += 1;
      else if (p.mark === 'L') leave += 1;
      else if (p.mark === 'O') {
        present += 1;
        ot += p.otHours;
      } else absent += 1;
      return { s, v, p };
    });
    if ($('#staffAttStats')) {
      $('#staffAttStats').innerHTML = `
        <div class="card"><h3>Staff</h3><div class="stat">${people.length}</div><div class="hint">${date}</div></div>
        <div class="card"><h3>Present</h3><div class="stat ok">${present}</div><div class="hint">incl. OT</div></div>
        <div class="card"><h3>Half / Leave</h3><div class="stat">${half} / ${leave}</div></div>
        <div class="card"><h3>Absent</h3><div class="stat ${absent ? 'danger' : ''}">${absent}</div><div class="hint">OT ${ot || 0}h</div></div>`;
    }
    if (!people.length) {
      $('#staffAttGrid').innerHTML = `<div class="empty">No staff yet. Add people in Staff Management.</div>`;
      return;
    }
    const markName = (css) =>
      css === 'X' ? 'Present' : css === 'A' ? 'Absent' : css === 'H' ? 'Half' : css === 'L' ? 'Leave' : css === 'O' ? 'OT' : css;
    $('#staffAttGrid').innerHTML = `
      <div class="table-wrap" style="border:none;max-height:none">
        <table>
          <thead>
            <tr>
              <th>Code</th><th>Name</th><th>Role</th><th>Status</th>
              <th>Mark</th><th class="num">OT hrs</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(({ s, v, p }) => {
                const css = attCss(v);
                return `<tr>
                  <td style="font-family:var(--num);font-size:.82rem">${staffCodeOf(s)}</td>
                  <td><strong>${s.name}</strong></td>
                  <td>${s.designation || '—'}</td>
                  <td><span class="badge ${s.exitDate && s.exitDate < date ? 'danger' : 'ok'}">${
                    s.exitDate && s.exitDate < date ? 'Left' : 'Active'
                  }</span></td>
                  <td>
                    <button type="button" class="att-mark ${css}${css === 'O' ? ' ot-hrs' : ''}" data-sa-sid="${s.id}" data-sa-day="${day}" title="Tap to cycle">
                      ${attLabel(v)}
                    </button>
                    <span style="margin-left:8px;color:var(--muted);font-size:.8rem">${markName(css)}</span>
                  </td>
                  <td class="num">${p.mark === 'O' ? p.otHours : '—'}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
      <div class="att-legend" style="padding:10px 14px">
        <span><i class="X">X</i> Present</span>
        <span><i class="A">A</i> Absent</span>
        <span><i class="H">H</i> Half</span>
        <span><i class="L">L</i> Leave</span>
        <span><i class="O">4h</i> OT</span>
        <span>Day ${day} · ${people.length} staff · tap X→A→H→L→OT→X · right-click OT hours</span>
      </div>`;
    $$('#staffAttGrid [data-sa-sid]').forEach((cell) => {
      cell.addEventListener('click', (e) =>
        cycleStaffSectionAtt(cell.dataset.saSid, Number(cell.dataset.saDay), ym, {
          alt: e.altKey || e.metaKey,
        })
      );
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        cycleStaffSectionAtt(cell.dataset.saSid, Number(cell.dataset.saDay), ym, { editOt: true });
      });
    });
  }

  function renderStaffAttMonthly() {
    const ym = ensureStaffAttMonthOptions();
    const dim = daysInMonth(ym);
    const people = staffAttPeople(ym);
    let present = 0,
      half = 0,
      leave = 0,
      absent = 0,
      ot = 0,
      dayUnits = 0;
    people.forEach((s) => {
      const st = attendanceStats(s.id, ym);
      dayUnits += st.days;
      ot += st.ot;
      for (let d = 1; d <= dim; d++) {
        const m = parseAtt(getAtt(s.id, d, ym)).mark;
        if (m === 'X' || m === 'O') present += 1;
        else if (m === 'H') half += 1;
        else if (m === 'L') leave += 1;
        else absent += 1;
      }
    });
    if ($('#staffAttStats')) {
      $('#staffAttStats').innerHTML = `
        <div class="card"><h3>Staff</h3><div class="stat">${people.length}</div><div class="hint">${monthLabel(ym)}</div></div>
        <div class="card"><h3>Present marks</h3><div class="stat ok">${present}</div></div>
        <div class="card"><h3>Half / Leave</h3><div class="stat">${half} / ${leave}</div></div>
        <div class="card"><h3>OT hours</h3><div class="stat">${ot || 0}</div><div class="hint">${dayUnits} day units</div></div>`;
    }
    if (!people.length) {
      $('#staffAttGrid').innerHTML = `<div class="empty">No staff yet. Add people in Staff Management.</div>`;
      return;
    }
    let head = `<th class="staff-col">Name</th>`;
    for (let d = 1; d <= dim; d++) head += `<th>${d}</th>`;
    head += `<th class="num">Days</th><th class="num">OT</th>`;
    const body = people
      .map((s) => {
        const st = attendanceStats(s.id, ym);
        let cells = `<td class="staff-col"><span class="att-staff-name">${s.name}</span><span class="att-staff-role">${staffCodeOf(s)} · ${s.designation || ''}${s.exitDate ? ' · Left' : ''}</span></td>`;
        for (let d = 1; d <= dim; d++) {
          const v = getAtt(s.id, d, ym);
          const mark = attCss(v);
          const label = attLabel(v);
          const title =
            mark === 'O'
              ? `${s.name} · day ${d} · OT ${parseAtt(v).otHours}h`
              : `${s.name} · day ${d} · tap to cycle`;
          cells += `<td><button type="button" class="att-mark ${mark}${mark === 'O' ? ' ot-hrs' : ''}" data-sa-sid="${s.id}" data-sa-day="${d}" title="${title}">${label}</button></td>`;
        }
        cells += `<td class="num"><strong>${st.days}</strong></td><td class="num">${st.ot ? st.ot + 'h' : '—'}</td>`;
        return `<tr>${cells}</tr>`;
      })
      .join('');
    const sumDays = people.reduce((a, s) => a + attendanceStats(s.id, ym).days, 0);
    const sumOt = people.reduce((a, s) => a + attendanceStats(s.id, ym).ot, 0);
    $('#staffAttGrid').innerHTML = `
      <table class="att-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr>
          <td class="staff-col"><strong>Sum</strong></td>
          ${Array.from({ length: dim }, () => '<td></td>').join('')}
          <td class="num"><strong>${sumDays}</strong></td>
          <td class="num"><strong>${sumOt ? sumOt + 'h' : '—'}</strong></td>
        </tr></tfoot>
      </table>
      <div class="att-legend">
        <span><i class="X">X</i> Present</span>
        <span><i class="A">A</i> Absent</span>
        <span><i class="H">H</i> Half</span>
        <span><i class="L">L</i> Leave</span>
        <span><i class="O">4h</i> OT</span>
        <span>All staff · ${people.length} · tap X→A→H→L→OT→X · right-click OT hours</span>
      </div>`;
    $$('#staffAttGrid [data-sa-sid]').forEach((cell) => {
      cell.addEventListener('click', (e) =>
        cycleStaffSectionAtt(cell.dataset.saSid, Number(cell.dataset.saDay), ym, {
          alt: e.altKey || e.metaKey,
        })
      );
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        cycleStaffSectionAtt(cell.dataset.saSid, Number(cell.dataset.saDay), ym, { editOt: true });
      });
    });
  }

  function renderGangAttDaily() {
    const { date, ym, day } = parseStaffAttDate();
    const gangs = staffAttGangs(date);
    let withPeople = 0;
    let manDays = 0;
    let night = 0;
    let ot = 0;
    const rows = gangs.map((l) => {
      const cur = getLabAtt(l.id, day, ym);
      if (labAttActive(cur)) withPeople += 1;
      manDays += cur.n;
      night += cur.night;
      ot += cur.ot;
      return { l, cur };
    });
    if ($('#staffAttStats')) {
      $('#staffAttStats').innerHTML = `
        <div class="card"><h3>Groups</h3><div class="stat">${gangs.length}</div><div class="hint">${date}</div></div>
        <div class="card"><h3>Day</h3><div class="stat ok">${manDays}</div><div class="hint">${withPeople} working</div></div>
        <div class="card"><h3>Night</h3><div class="stat">${night || 0}</div><div class="hint">Night shift</div></div>
        <div class="card"><h3>OT hours</h3><div class="stat">${ot || 0}</div></div>`;
    }
    if (!gangs.length) {
      $('#staffAttGrid').innerHTML = `<div class="empty">No contract groups for FY ${fyFromDate(date)}. Add under Staff Management → Contract group.</div>`;
      return;
    }
    $('#staffAttGrid').innerHTML = `
      <div class="table-wrap" style="border:none;max-height:none">
        <table>
          <thead>
            <tr>
              <th>Gang</th><th>FY</th><th class="num">Day rate</th>
              <th class="num">Day</th><th class="num">Night</th><th class="num">OT hrs</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(({ l, cur }) => {
                const label = labAttLabel(cur);
                const cls = labAttActive(cur) ? 'lab' : 'lab-empty';
                return `<tr>
                  <td><strong>${l.name}</strong></td>
                  <td>${l.fy || '—'}</td>
                  <td class="num">${money(l.dayRate)}</td>
                  <td class="num">
                    <button type="button" class="att-mark ${cls}" data-sa-lid="${l.id}" data-sa-day="${day}" title="Tap to mark">${label}</button>
                  </td>
                  <td class="num">${cur.night || '—'}</td>
                  <td class="num">${cur.ot || '—'}</td>
                  <td><button type="button" class="btn btn-ghost btn-sm" data-sa-lid-edit="${l.id}">Mark</button></td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
      <div class="att-legend" style="padding:10px 14px">
        <span><i class="lab">12</i> Day</span>
        <span><i class="lab">12+2N</i> + night</span>
        <span><i class="lab">12+4h</i> + OT</span>
        <span>Day ${day} · ${gangs.length} groups · tap to enter day / night / OT</span>
      </div>`;
    const open = (lid) => openLabDayModal(lid, day, ym);
    $$('#staffAttGrid [data-sa-lid]').forEach((b) =>
      b.addEventListener('click', () => open(b.dataset.saLid))
    );
    $$('#staffAttGrid [data-sa-lid-edit]').forEach((b) =>
      b.addEventListener('click', () => open(b.dataset.saLidEdit))
    );
  }

  function renderGangAttMonthly() {
    const ym = ensureStaffAttMonthOptions();
    const dim = daysInMonth(ym);
    const gangs = staffAttGangs(ym);
    const sumMan = gangs.reduce((a, l) => a + labourMonthStats(l.id, ym).manDays, 0);
    const sumNight = gangs.reduce((a, l) => a + labourMonthStats(l.id, ym).night, 0);
    const sumOt = gangs.reduce((a, l) => a + labourMonthStats(l.id, ym).ot, 0);
    const working = gangs.filter((l) => {
      const st = labourMonthStats(l.id, ym);
      return st.manDays > 0 || st.night > 0;
    }).length;
    if ($('#staffAttStats')) {
      $('#staffAttStats').innerHTML = `
        <div class="card"><h3>Groups</h3><div class="stat">${gangs.length}</div><div class="hint">${monthLabel(ym)}</div></div>
        <div class="card"><h3>Day</h3><div class="stat ok">${sumMan}</div><div class="hint">${working} working</div></div>
        <div class="card"><h3>Night</h3><div class="stat">${sumNight || 0}</div><div class="hint">Night shift</div></div>
        <div class="card"><h3>OT hours</h3><div class="stat">${sumOt || 0}</div></div>`;
    }
    if (!gangs.length) {
      $('#staffAttGrid').innerHTML = `<div class="empty">No contract groups for FY ${fyFromDate(ym + '-01')}. Add under Staff Management → Contract group.</div>`;
      return;
    }
    const kinds = [
      { key: 'n', label: 'Day', totalKey: 'manDays', suffix: '' },
      { key: 'night', label: 'Night', totalKey: 'night', suffix: '' },
      { key: 'ot', label: 'OT hrs', totalKey: 'ot', suffix: 'h' },
    ];
    let head = `<th class="staff-col">Gang</th><th class="att-kind-col">Type</th>`;
    for (let d = 1; d <= dim; d++) head += `<th>${d}</th>`;
    head += `<th class="num">Total</th>`;
    const body = gangs
      .map((l) => {
        const st = labourMonthStats(l.id, ym);
        return kinds
          .map((k, ki) => {
            let cells = '';
            if (ki === 0) {
              cells += `<td class="staff-col" rowspan="3"><span class="att-staff-name">${l.name}</span><span class="att-staff-role">FY ${l.fy} · ${money(l.dayRate)}/day · night ${money(l.otNightRate || l.dayRate)}</span></td>`;
            }
            cells += `<td class="att-kind-col"><span class="att-kind-tag att-kind-${k.key}">${k.label}</span></td>`;
            for (let d = 1; d <= dim; d++) {
              const cur = getLabAtt(l.id, d, ym);
              const val = Number(cur[k.key] || 0);
              const cls = val ? 'lab' : 'lab-empty';
              const label = val ? String(val) : '·';
              cells += `<td><button type="button" class="att-mark ${cls}" data-sa-lid="${l.id}" data-sa-day="${d}" title="${l.name} · ${k.label} · day ${d}">${label}</button></td>`;
            }
            const tot = st[k.totalKey] || 0;
            cells += `<td class="num"><strong>${tot ? tot + k.suffix : '—'}</strong></td>`;
            return `<tr class="att-kind-row att-kind-row-${k.key}">${cells}</tr>`;
          })
          .join('');
      })
      .join('');
    // Per-day sums for each kind
    const daySums = { n: [], night: [], ot: [] };
    for (let d = 1; d <= dim; d++) {
      let sn = 0,
        sng = 0,
        so = 0;
      gangs.forEach((l) => {
        const cur = getLabAtt(l.id, d, ym);
        sn += cur.n;
        sng += cur.night;
        so += cur.ot;
      });
      daySums.n.push(sn);
      daySums.night.push(sng);
      daySums.ot.push(so);
    }
    const foot = kinds
      .map((k, ki) => {
        let cells = '';
        if (ki === 0) cells += `<td class="staff-col" rowspan="3"><strong>Sum</strong></td>`;
        cells += `<td class="att-kind-col"><strong>${k.label}</strong></td>`;
        for (let d = 0; d < dim; d++) {
          const v = daySums[k.key][d];
          cells += `<td class="num">${v || ''}</td>`;
        }
        const tot = k.key === 'n' ? sumMan : k.key === 'night' ? sumNight : sumOt;
        cells += `<td class="num"><strong>${tot ? tot + k.suffix : '—'}</strong></td>`;
        return `<tr>${cells}</tr>`;
      })
      .join('');
    $('#staffAttGrid').innerHTML = `
      <table class="att-table att-table-gang-split">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
        <tfoot>${foot}</tfoot>
      </table>
      <div class="att-legend">
        <span><i class="lab">12</i> Day headcount</span>
        <span><i class="lab">2</i> Night shift</span>
        <span><i class="lab">4</i> OT hours</span>
        <span>Each gang = 3 rows · tap any cell to edit that day · ${monthLabel(ym)}</span>
      </div>`;
    $$('#staffAttGrid [data-sa-lid]').forEach((cell) =>
      cell.addEventListener('click', () =>
        openLabDayModal(cell.dataset.saLid, Number(cell.dataset.saDay), ym)
      )
    );
  }

  function renderStaffAtt() {
    if (!$('#staffAttGrid')) return;
    syncStaffAttViewUi();
    if (staffAttScope === 'gangs') {
      if (staffAttView === 'day') {
        ensureStaffAttDate();
        renderGangAttDaily();
      } else {
        ensureStaffAttMonthOptions();
        renderGangAttMonthly();
      }
      return;
    }
    if (staffAttView === 'day') {
      ensureStaffAttDate();
      renderStaffAttDaily();
    } else {
      ensureStaffAttMonthOptions();
      renderStaffAttMonthly();
    }
  }

  function exportStaffAtt(kind) {
    if (staffAttScope === 'gangs') {
      if (staffAttView === 'day') {
        const { date, ym, day } = parseStaffAttDate();
        const gangs = staffAttGangs(date);
        if (!gangs.length) {
          toast('No contract groups to export');
          return;
        }
        if (kind === 'excel') {
          downloadCsv(`gang-attendance-daily-${activeQuarry().code}-${date}.csv`, [
            ['Gang', 'FY', 'Day rate', 'Day', 'Night', 'OT hrs'],
            ...gangs.map((l) => {
              const cur = getLabAtt(l.id, day, ym);
              return [l.name, l.fy || '', l.dayRate, cur.n || 0, cur.night || 0, cur.ot || 0];
            }),
          ]);
          toast('Excel downloaded');
          return;
        }
        const body = gangs
          .map((l) => {
            const cur = getLabAtt(l.id, day, ym);
            return `<tr><td>${l.name}</td><td>${l.fy || ''}</td><td class="num">${cur.n || 0}</td><td class="num">${cur.night || 0}</td><td class="num">${cur.ot || 0}</td></tr>`;
          })
          .join('');
        printReport(
          `Contract group attendance · ${date}`,
          `<table><thead><tr><th>Gang</th><th>FY</th><th>Day</th><th>Night</th><th>OT</th></tr></thead><tbody>${body}</tbody></table>`
        );
        return;
      }
      const ym = ensureStaffAttMonthOptions();
      const dim = daysInMonth(ym);
      const gangs = staffAttGangs(ym);
      if (!gangs.length) {
        toast('No contract groups to export');
        return;
      }
      if (kind === 'excel') {
        const header = [
          'Gang',
          'FY',
          ...Array.from({ length: dim }, (_, i) => String(i + 1)),
          'Day',
          'Night',
          'OT',
        ];
        const rows = gangs.map((l) => {
          const st = labourMonthStats(l.id, ym);
          const days = [];
          for (let d = 1; d <= dim; d++) days.push(labAttLabel(getLabAtt(l.id, d, ym)).replace('·', ''));
          return [l.name, l.fy || '', ...days, st.manDays, st.night || 0, st.ot || 0];
        });
        downloadCsv(`gang-attendance-${activeQuarry().code}-${ym}.csv`, [header, ...rows]);
        toast('Excel downloaded');
        return;
      }
      let head = '<th>Gang</th>';
      for (let d = 1; d <= dim; d++) head += `<th>${d}</th>`;
      head += '<th>Day</th><th>Night</th><th>OT</th>';
      const body = gangs
        .map((l) => {
          const st = labourMonthStats(l.id, ym);
          let cells = `<td>${l.name}</td>`;
          for (let d = 1; d <= dim; d++) {
            const label = labAttLabel(getLabAtt(l.id, d, ym));
            cells += `<td>${label === '·' ? '' : label}</td>`;
          }
          cells += `<td>${st.manDays}</td><td>${st.night || '—'}</td><td>${st.ot || '—'}</td>`;
          return `<tr>${cells}</tr>`;
        })
        .join('');
      printReport(
        `Contract group attendance · ${monthLabel(ym)}`,
        `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
      );
      return;
    }
    if (staffAttView === 'day') {
      const { date, ym, day } = parseStaffAttDate();
      const people = staffAttPeople(date);
      if (!people.length) {
        toast('No staff to export');
        return;
      }
      if (kind === 'excel') {
        downloadCsv(`staff-attendance-daily-${activeQuarry().code}-${date}.csv`, [
          ['Code', 'Name', 'Role', 'Status', 'Mark', 'OT hrs'],
          ...people.map((s) => {
            const v = getAtt(s.id, day, ym);
            const p = parseAtt(v);
            return [
              staffCodeOf(s),
              s.name,
              s.designation || '',
              personStatus(s),
              attLabel(v),
              p.mark === 'O' ? p.otHours : '',
            ];
          }),
        ]);
        toast('Excel downloaded');
        return;
      }
      const body = people
        .map((s) => {
          const v = getAtt(s.id, day, ym);
          const p = parseAtt(v);
          return `<tr><td>${staffCodeOf(s)}</td><td>${s.name}</td><td>${s.designation || ''}</td><td>${attLabel(v)}</td><td class="num">${p.mark === 'O' ? p.otHours : '—'}</td></tr>`;
        })
        .join('');
      printReport(
        `Staff attendance · ${date}`,
        `<table><thead><tr><th>Code</th><th>Name</th><th>Role</th><th>Mark</th><th>OT</th></tr></thead><tbody>${body}</tbody></table>`
      );
      return;
    }
    const ym = ensureStaffAttMonthOptions();
    const dim = daysInMonth(ym);
    const people = staffAttPeople(ym);
    if (!people.length) {
      toast('No staff to export');
      return;
    }
    if (kind === 'excel') {
      const header = ['Code', 'Name', 'Role', ...Array.from({ length: dim }, (_, i) => String(i + 1)), 'Days', 'OT'];
      const rows = people.map((s) => {
        const st = attendanceStats(s.id, ym);
        const days = [];
        for (let d = 1; d <= dim; d++) days.push(attLabel(getAtt(s.id, d, ym)));
        return [staffCodeOf(s), s.name, s.designation || '', ...days, st.days, st.ot || 0];
      });
      downloadCsv(`staff-attendance-${activeQuarry().code}-${ym}.csv`, [header, ...rows]);
      toast('Excel downloaded');
      return;
    }
    let head = '<th>Name</th>';
    for (let d = 1; d <= dim; d++) head += `<th>${d}</th>`;
    head += '<th>Days</th><th>OT</th>';
    const body = people
      .map((s) => {
        const st = attendanceStats(s.id, ym);
        let cells = `<td>${s.name}<div style="color:#667787;font-size:.75rem">${staffCodeOf(s)}</div></td>`;
        for (let d = 1; d <= dim; d++) cells += `<td>${attLabel(getAtt(s.id, d, ym))}</td>`;
        cells += `<td>${st.days}</td><td>${st.ot || '—'}</td>`;
        return `<tr>${cells}</tr>`;
      })
      .join('');
    printReport(
      `Staff attendance · ${monthLabel(ym)}`,
      `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
    );
  }

  $('#addStaffMgmtBtn')?.addEventListener('click', () => openStaffMgmtForm(null));
  $('#exportStaffMgmtBtn')?.addEventListener('click', exportStaffMgmtList);
  $('#smAddLabourBtn')?.addEventListener('click', () => openAddLabour({ simple: true }));
  $$('#staffMgmtTabs .tab').forEach((t) =>
    t.addEventListener('click', () => {
      staffMgmtTab = t.dataset.smtab || 'staff';
      syncStaffMgmtTabUi();
      if (staffMgmtTab === 'gangs') renderLabourGangs();
    })
  );
  $('#gangDetailBack')?.addEventListener('click', () => {
    staffMgmtTab = 'gangs';
    go('staffmgmt');
  });
  $('#gangDetailEditBtn')?.addEventListener('click', () => {
    if (selectedGangId) openEditLabour(selectedGangId, { simple: true });
  });
  $('#gangDetailAdvanceBtn')?.addEventListener('click', () => {
    if (selectedGangId) openGiveLabourAdvance(selectedGangId);
  });
  $('#gangDetailPayBtn')?.addEventListener('click', () => {
    if (!selectedGangId) return;
    openPayLabour(selectedGangId, monthKey());
  });
  $('#staffMgmtSearch')?.addEventListener('input', () => {
    tableUI.staffmgmt.page = 1;
    renderStaffMgmt();
  });
  $('#staffMgmtFilter')?.addEventListener('change', () => {
    tableUI.staffmgmt.page = 1;
    renderStaffMgmt();
  });
  $('#staffMgmtSort')?.addEventListener('change', () => {
    tableUI.staffmgmt.page = 1;
    renderStaffMgmt();
  });
  $('#staffMgmtPageSize')?.addEventListener('change', () => {
    tableUI.staffmgmt.page = 1;
    renderStaffMgmt();
  });
  $('#staffDetailBack')?.addEventListener('click', () => go('staffmgmt'));
  $('#staffDetailEditBtn')?.addEventListener('click', () => {
    if (selectedStaffMgmtId) openStaffMgmtForm(selectedStaffMgmtId);
  });
  $('#staffDetailAdvanceBtn')?.addEventListener('click', () => {
    if (!selectedStaffMgmtId) return;
    openGiveAdvance(selectedStaffMgmtId);
  });
  $('#staffDetailPayBtn')?.addEventListener('click', () => {
    if (selectedStaffMgmtId) openStaffMgmtPaySalary(selectedStaffMgmtId);
  });
  $('#staffDetailOtherBtn')?.addEventListener('click', () => {
    if (selectedStaffMgmtId) openStaffMgmtOtherTxn(selectedStaffMgmtId);
  });
  $('#staffDetailExitBtn')?.addEventListener('click', () => {
    if (!selectedStaffMgmtId) return;
    openExitModal(selectedStaffMgmtId);
  });
  $('#staffDetailRejoinBtn')?.addEventListener('click', () => {
    if (!selectedStaffMgmtId) return;
    openRejoinModal(selectedStaffMgmtId);
  });
  $('#staffDetailDeleteBtn')?.addEventListener('click', () => {
    if (selectedStaffMgmtId) deleteStaffPerson(selectedStaffMgmtId);
  });
  $('#staffDetailTxnSearch')?.addEventListener('input', () => {
    if ($('.page.active')?.id === 'page-staffdetail') renderStaffDetail();
  });
  $('#staffDetailTxnScope')?.addEventListener('change', () => {
    staffDetailTxnScope = $('#staffDetailTxnScope').value || 'overall';
    if ($('.page.active')?.id === 'page-staffdetail') renderStaffDetail();
  });
  $('#staffDetailTxnMonth')?.addEventListener('change', () => {
    staffDetailTxnYm = $('#staffDetailTxnMonth').value;
    if ($('.page.active')?.id === 'page-staffdetail') renderStaffDetail();
  });
  $('#staffDetailTxnType')?.addEventListener('change', () => {
    staffDetailTxnType = $('#staffDetailTxnType').value || 'all';
    if ($('.page.active')?.id === 'page-staffdetail') renderStaffDetail();
  });
  $('#staffDetailTxnExport')?.addEventListener('click', () => exportStaffDetailLedger('excel'));
  $('#staffDetailTxnPdf')?.addEventListener('click', () => exportStaffDetailLedger('pdf'));
  $$('#staffDetailTabs .party-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      staffDetailTab = tab.dataset.sdt;
      if ($('.page.active')?.id === 'page-staffdetail') renderStaffDetail();
    });
  });
  $('#staffAttMonth')?.addEventListener('change', () => {
    staffAttYm = $('#staffAttMonth').value;
    if ($('#staffAttMonthLabel')) $('#staffAttMonthLabel').textContent = monthLabel(staffAttYm);
    renderStaffAtt();
  });
  $('#staffAttMonthPrev')?.addEventListener('click', () => goStaffAttMonth(-1));
  $('#staffAttMonthNext')?.addEventListener('click', () => goStaffAttMonth(1));
  $('#staffAttDayPrev')?.addEventListener('click', () => goStaffAttDay(-1));
  $('#staffAttDayNext')?.addEventListener('click', () => goStaffAttDay(1));
  $('#staffAttDate')?.addEventListener('change', () => {
    staffAttDate = $('#staffAttDate').value || today();
    staffAttYm = staffAttDate.slice(0, 7);
    renderStaffAtt();
  });
  $$('#staffAttViewTabs .party-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      staffAttView = tab.dataset.saview || 'day';
      if (staffAttView === 'month' && staffAttDate) staffAttYm = staffAttDate.slice(0, 7);
      if (staffAttView === 'day' && staffAttYm && !staffAttDate) {
        staffAttDate = `${staffAttYm}-01`;
      }
      renderStaffAtt();
    });
  });
  $$('#staffAttScopeTabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      staffAttScope = tab.dataset.sascope || 'staff';
      renderStaffAtt();
    });
  });
  $('#staffAttSearch')?.addEventListener('input', renderStaffAtt);
  $('#staffAttExcel')?.addEventListener('click', () => exportStaffAtt('excel'));
  $('#staffAttPdf')?.addEventListener('click', () => exportStaffAtt('pdf'));

  /* ---------- Staff Salary Sheet (separate from Payroll) ---------- */
  function ensureStaffSalMonthOptions() {
    const sel = $('#staffSalMonth');
    const opts = recentMonths(24);
    if (sel) {
      const curVal = staffSalYm || sel.value;
      const extra = [];
      if (curVal && !opts.includes(curVal)) extra.push(curVal);
      const all = [...extra, ...opts];
      if (!sel.dataset.filled || sel.options.length !== all.length) {
        sel.innerHTML = all.map((v) => `<option value="${v}">${monthLabel(v)}</option>`).join('');
        sel.dataset.filled = '1';
      }
      if (!staffSalYm || !all.includes(staffSalYm)) staffSalYm = all.includes(opts[0]) ? opts[0] : all[0];
      if (sel.value !== staffSalYm) sel.value = staffSalYm;
    } else if (!staffSalYm) {
      staffSalYm = opts[0];
    }
    if ($('#staffSalMonthLabel')) $('#staffSalMonthLabel').textContent = monthLabel(staffSalYm);
    if ($('#staffSalTitleMonth')) $('#staffSalTitleMonth').textContent = monthLabel(staffSalYm);
    return staffSalYm;
  }

  function goStaffSalMonth(delta) {
    const cur = ensureStaffSalMonthOptions();
    staffSalYm = shiftYm(cur, delta);
    const sel = $('#staffSalMonth');
    if (sel && ![...sel.options].some((o) => o.value === staffSalYm)) {
      const opt = new Option(monthLabel(staffSalYm), staffSalYm);
      if (delta < 0) sel.insertBefore(opt, sel.firstChild);
      else sel.appendChild(opt);
    }
    if (sel) sel.value = staffSalYm;
    if ($('#staffSalMonthLabel')) $('#staffSalMonthLabel').textContent = monthLabel(staffSalYm);
    renderStaffSalaryPage();
  }

  function ensureStaffAdvDate() {
    const inp = $('#staffAdvDate');
    if (!staffAdvDate) staffAdvDate = today();
    if (inp && inp.value !== staffAdvDate) inp.value = staffAdvDate;
    return staffAdvDate;
  }

  function goStaffAdvDay(delta) {
    staffAdvDate = shiftDate(ensureStaffAdvDate(), delta);
    staffSalYm = staffAdvDate.slice(0, 7);
    if ($('#staffAdvDate')) $('#staffAdvDate').value = staffAdvDate;
    renderStaffSalaryPage();
  }

  function syncStaffSalTabUi() {
    $$('#staffSalMainTabs .tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.sstab === staffSalTab)
    );
    $$('#staffAdvViewTabs .party-tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.savadv === staffAdvView)
    );
    const isPay = staffSalTab === 'pay';
    const isAdvDay = staffSalTab === 'adv' && staffAdvView === 'day';
    if ($('#staffSalTabPay')) $('#staffSalTabPay').style.display = isPay ? '' : 'none';
    if ($('#staffSalTabAdv')) $('#staffSalTabAdv').style.display = isPay ? 'none' : '';
    if ($('#staffAdvViewTabs')) $('#staffAdvViewTabs').style.display = isPay ? 'none' : '';
    if ($('#staffSalPayActions')) $('#staffSalPayActions').style.display = isPay ? '' : 'none';
    if ($('#staffAdvActions')) $('#staffAdvActions').style.display = isPay ? 'none' : '';
    if ($('#staffSalMonthWrap')) $('#staffSalMonthWrap').style.display = isAdvDay ? 'none' : '';
    if ($('#staffAdvDayWrap')) $('#staffAdvDayWrap').style.display = isAdvDay ? '' : 'none';
  }

  function syncStaffSalSelectUI() {
    const boxes = $$('#staffSalTable input.ssal-check');
    const checked = boxes.filter((c) => c.checked);
    const btn = $('#staffSalPaySelected');
    if (btn) {
      btn.disabled = !checked.length;
      btn.textContent = checked.length ? `Pay selected (${checked.length})` : 'Pay selected';
    }
    const all = $('#staffSalSelectAll');
    if (all) {
      all.checked = boxes.length > 0 && checked.length === boxes.length;
      all.indeterminate = checked.length > 0 && checked.length < boxes.length;
    }
  }

  function selectedStaffSalPeople() {
    return $$('#staffSalTable input.ssal-check:checked')
      .map((c) => state.staff.find((x) => x.id === c.value))
      .filter(Boolean);
  }

  function staffAdvanceRows(scope) {
    return quarryExpenses()
      .filter((e) => e.head === 'Salary Advance' && Number(e.debit) > 0)
      .filter((e) => {
        if (!e.date) return false;
        if (scope.length === 10) return e.date === scope;
        return e.date.startsWith(scope);
      })
      .map((e) => {
        if (e.labourId) return null;
        let p = e.personId ? state.staff.find((x) => x.id === e.personId) : null;
        if (!p) {
          const guessed = resolveAdvanceLink(e.particulars);
          if (guessed.personId) p = state.staff.find((x) => x.id === guessed.personId);
          if (guessed.labourId) return null;
        }
        if (p && (p.category || 'Staff') === 'Worker') return null;
        if (p && p.quarryId && p.quarryId !== state.activeQuarryId) return null;
        return {
          e,
          p,
          name: p?.name || '—',
          code: p ? staffCodeOf(p) : '—',
          role: p?.designation || '—',
        };
      })
      .filter(Boolean);
  }

  function renderStaffPaySheet() {
    if (!$('#staffSalTable')) return;
    const ym = ensureStaffSalMonthOptions();
    const dim = daysInMonth(ym);
    const q = ($('#staffSalSearch')?.value || '').toLowerCase().trim();
    const sort = $('#staffSalSort')?.value || 'name';

    let people = peopleForMonth(ym, 'Staff').map((s) => ({
      s,
      row: salaryRow(s, ym, dim),
    }));
    if (q) {
      people = people.filter(({ s }) =>
        `${staffCodeOf(s)} ${s.name} ${s.designation || ''}`.toLowerCase().includes(q)
      );
    }
    people.sort((a, b) => {
      if (sort === 'net-desc') return b.row.net - a.row.net;
      if (sort === 'net-asc') return a.row.net - b.row.net;
      if (sort === 'status')
        return (a.row.paid ? 1 : 0) - (b.row.paid ? 1 : 0) || a.s.name.localeCompare(b.s.name);
      return a.s.name.localeCompare(b.s.name);
    });

    const sum = {
      n: people.length,
      earned: people.reduce((a, p) => a + p.row.earned, 0),
      adv: people.reduce((a, p) => a + p.row.adv, 0),
      net: people.reduce((a, p) => a + p.row.net, 0),
      unpaid: people.filter((p) => !p.row.paid && p.row.net > 0).length,
      unpaidAmt: people
        .filter((p) => !p.row.paid && p.row.net > 0)
        .reduce((a, p) => a + p.row.net, 0),
    };
    if ($('#staffSalStats')) {
      $('#staffSalStats').innerHTML = `
        <div class="card"><h3>Staff</h3><div class="stat">${sum.n}</div><div class="hint">${monthLabel(ym)}</div></div>
        <div class="card"><h3>Earned</h3><div class="stat">${money(sum.earned)}</div><div class="hint">From attendance</div></div>
        <div class="card"><h3>Advances</h3><div class="stat danger">${money(sum.adv)}</div><div class="hint">This month</div></div>
        <div class="card"><h3>Unpaid</h3><div class="stat ${sum.unpaid ? 'warn' : 'ok'}">${money(sum.unpaidAmt)}</div><div class="hint">${sum.unpaid} people</div></div>`;
    }

    const page = slicePage(people, 'staffsalary', '#staffSalPageSize');
    $('#staffSalTable').innerHTML = page.rows.length
      ? page.rows
          .map(({ s, row }) => {
            const { days, ot, earned, adv, net, paid } = row;
            const canPay = !paid && net > 0;
            const status = paid
              ? `<span class="badge ok">Paid · ${paid.mode}</span><div class="s" style="color:var(--muted);font-size:.72rem">${paid.date}</div>`
              : net > 0
                ? `<span class="badge warn">Unpaid</span>`
                : `<span class="badge">₹0</span>`;
            const action = canPay
              ? `<button class="btn btn-primary btn-sm" data-ss-pay="${s.id}">Pay</button>`
              : paid
                ? `<button class="btn btn-ghost btn-sm" data-ss-unpay="${s.id}">Undo</button>`
                : '';
            const check = canPay
              ? `<input type="checkbox" class="ssal-check" value="${s.id}" aria-label="Select ${s.name}" />`
              : '';
            return `<tr>
              <td>${check}</td>
              <td><span style="font-variant-numeric:tabular-nums;color:var(--muted);font-size:.85rem">${staffCodeOf(s)}</span></td>
              <td><strong>${s.name}</strong></td>
              <td>${s.designation || '—'}</td>
              <td class="num">${rateLabel(s)}</td>
              <td class="num">${days}</td>
              <td class="num">${ot ? ot + 'h' : '—'}</td>
              <td class="num">${money(earned)}</td>
              <td class="num">${money(adv)}</td>
              <td class="num"><strong>${money(net)}</strong></td>
              <td>${status}</td>
              <td>${action}</td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="12"><div class="empty">No staff for ${monthLabel(ym)}. Hire under Staff Management or mark Attendance.</div></td></tr>`;

    if ($('#staffSalFoot')) {
      $('#staffSalFoot').innerHTML = people.length
        ? `<tr>
            <td></td>
            <td colspan="3"><strong>Sum</strong> <span style="color:var(--muted);font-weight:400;font-size:.8rem">(${sum.n})</span></td>
            <td></td>
            <td class="num"><strong>${people.reduce((a, p) => a + p.row.days, 0)}</strong></td>
            <td class="num"><strong>${(() => {
              const ot = people.reduce((a, p) => a + p.row.ot, 0);
              return ot ? ot + 'h' : '—';
            })()}</strong></td>
            <td class="num"><strong>${money(sum.earned)}</strong></td>
            <td class="num"><strong>${money(sum.adv)}</strong></td>
            <td class="num"><strong>${money(sum.net)}</strong></td>
            <td colspan="2"></td>
          </tr>`
        : '';
    }
    renderPager($('#staffSalPager'), 'staffsalary', page, renderStaffPaySheet);

    $$('[data-ss-pay]').forEach((b) =>
      b.addEventListener('click', () => openPaySalary(b.dataset.ssPay, ym))
    );
    $$('[data-ss-unpay]').forEach((b) =>
      b.addEventListener('click', () => reverseSalaryPayment(b.dataset.ssUnpay, ym))
    );
    $$('#staffSalTable input.ssal-check').forEach((c) =>
      c.addEventListener('change', syncStaffSalSelectUI)
    );
    const selAll = $('#staffSalSelectAll');
    if (selAll) {
      selAll.checked = false;
      selAll.indeterminate = false;
      selAll.onchange = () => {
        $$('#staffSalTable input.ssal-check').forEach((c) => {
          c.checked = selAll.checked;
        });
        syncStaffSalSelectUI();
      };
    }
    syncStaffSalSelectUI();
  }

  function renderStaffAdvances() {
    if (!$('#staffAdvTable')) return;
    const scope =
      staffAdvView === 'day' ? ensureStaffAdvDate() : ensureStaffSalMonthOptions();
    const label = staffAdvView === 'day' ? scope : monthLabel(scope);
    if ($('#staffAdvPanelTitle')) {
      $('#staffAdvPanelTitle').textContent =
        staffAdvView === 'day' ? `Advances · ${scope}` : `Advances · ${monthLabel(scope)}`;
    }

    const q = ($('#staffAdvSearch')?.value || '').toLowerCase().trim();
    const sort = $('#staffAdvSort')?.value || 'date-desc';
    let list = staffAdvanceRows(scope);
    if (q) {
      list = list.filter((row) =>
        `${row.code} ${row.name} ${row.role} ${row.e.particulars}`.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sort === 'date-asc') return a.e.date.localeCompare(b.e.date) || a.name.localeCompare(b.name);
      if (sort === 'amt-desc') return Number(b.e.debit) - Number(a.e.debit);
      if (sort === 'name') return a.name.localeCompare(b.name) || b.e.date.localeCompare(a.e.date);
      return b.e.date.localeCompare(a.e.date) || a.name.localeCompare(b.name);
    });

    const total = list.reduce((a, r) => a + Number(r.e.debit || 0), 0);
    const peopleN = new Set(list.map((r) => r.p?.id || r.name)).size;
    if ($('#staffAdvStats')) {
      $('#staffAdvStats').innerHTML = `
        <div class="card"><h3>Entries</h3><div class="stat">${list.length}</div><div class="hint">${label}</div></div>
        <div class="card"><h3>Staff</h3><div class="stat">${peopleN}</div><div class="hint">With advance</div></div>
        <div class="card"><h3>Total</h3><div class="stat danger">${money(total)}</div><div class="hint">Salary Advance</div></div>
        <div class="card"><h3>View</h3><div class="stat" style="font-size:1rem">${staffAdvView === 'day' ? 'Daily' : 'Monthly'}</div><div class="hint">Staff only</div></div>`;
    }

    const page = slicePage(list, 'staffadvances', '#staffAdvPageSize');
    $('#staffAdvTable').innerHTML = page.rows.length
      ? page.rows
          .map((row) => {
            const linked = row.p ? '' : ' <span class="badge warn">unlinked</span>';
            return `<tr>
              <td>${row.e.date}</td>
              <td><span style="font-variant-numeric:tabular-nums;color:var(--muted);font-size:.85rem">${row.code}</span></td>
              <td><strong>${row.name}</strong>${linked}</td>
              <td>${row.role}</td>
              <td>${row.e.particulars}<div class="s" style="color:var(--muted);font-size:.72rem">Salary Advance · All Transactions</div></td>
              <td class="num"><strong>${money(row.e.debit)}</strong></td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="6"><div class="empty">No staff advances for ${label}. Use + Give advance.</div></td></tr>`;

    if ($('#staffAdvFoot')) {
      $('#staffAdvFoot').innerHTML = list.length
        ? `<tr>
            <td colspan="5"><strong>Sum</strong> <span style="color:var(--muted);font-weight:400;font-size:.8rem">(${list.length})</span></td>
            <td class="num"><strong>${money(total)}</strong></td>
          </tr>`
        : '';
    }
    renderPager($('#staffAdvPager'), 'staffadvances', page, renderStaffAdvances);
  }

  function renderStaffSalaryPage() {
    if (!$('#page-staffsal')) return;
    syncStaffSalTabUi();
    if (staffSalTab === 'pay') {
      ensureStaffSalMonthOptions();
      renderStaffPaySheet();
    } else {
      if (staffAdvView === 'day') {
        ensureStaffAdvDate();
        staffSalYm = staffAdvDate.slice(0, 7);
      } else {
        ensureStaffSalMonthOptions();
      }
      renderStaffAdvances();
    }
  }

  // Back-compat alias used by pay/undo refresh paths
  function renderStaffSalary() {
    renderStaffSalaryPage();
  }

  function exportStaffSalary(kind) {
    const ym = ensureStaffSalMonthOptions();
    const dim = daysInMonth(ym);
    const people = peopleForMonth(ym, 'Staff');
    if (!people.length) {
      toast('No staff to export');
      return;
    }
    if (kind === 'excel') {
      const rows = [
        ['Code', 'Name', 'Role', 'Rate', 'Days', 'OT hrs', 'Earned', 'Advance', 'Net', 'Status', 'Paid date', 'Mode'],
      ];
      people.forEach((s) => {
        const r = salaryRow(s, ym, dim);
        rows.push([
          staffCodeOf(s),
          s.name,
          s.designation || '',
          rateLabel(s),
          r.days,
          r.ot,
          Math.round(r.earned),
          r.adv,
          r.net,
          r.paid ? 'Paid' : 'Unpaid',
          r.paid?.date || '',
          r.paid?.mode || '',
        ]);
      });
      downloadCsv(`staff-salary-${activeQuarry().code}-${ym}.csv`, rows);
      toast('Excel downloaded');
      return;
    }
    const body = people
      .map((s) => {
        const r = salaryRow(s, ym, dim);
        return `<tr>
          <td>${staffCodeOf(s)}</td><td>${s.name}</td><td>${s.designation || ''}</td>
          <td class="num">${r.days}</td><td class="num">${r.ot ? r.ot + 'h' : '—'}</td>
          <td class="num">${money(r.earned)}</td><td class="num">${money(r.adv)}</td>
          <td class="num">${money(r.net)}</td><td>${r.paid ? 'Paid ' + r.paid.mode : 'Unpaid'}</td>
        </tr>`;
      })
      .join('');
    printReport(
      `Staff salary · ${monthLabel(ym)}`,
      `<table><thead><tr>
        <th>Code</th><th>Name</th><th>Role</th><th>Days</th><th>OT</th>
        <th>Earned</th><th>Adv</th><th>Net</th><th>Status</th>
      </tr></thead><tbody>${body}</tbody></table>`
    );
  }

  function exportStaffAdvances(kind) {
    const scope =
      staffAdvView === 'day' ? ensureStaffAdvDate() : ensureStaffSalMonthOptions();
    const list = staffAdvanceRows(scope);
    if (!list.length) {
      toast('No advances to export');
      return;
    }
    const label = staffAdvView === 'day' ? scope : scope;
    if (kind === 'excel') {
      downloadCsv(`staff-advances-${activeQuarry().code}-${label}.csv`, [
        ['Date', 'Code', 'Name', 'Role', 'Comment', 'Amount'],
        ...list.map((r) => [
          r.e.date,
          r.code,
          r.name,
          r.role,
          r.e.particulars,
          Number(r.e.debit),
        ]),
      ]);
      toast('Excel downloaded');
      return;
    }
    const body = list
      .map(
        (r) =>
          `<tr><td>${r.e.date}</td><td>${r.code}</td><td>${r.name}</td><td>${r.role}</td><td>${r.e.particulars}</td><td class="num">${money(r.e.debit)}</td></tr>`
      )
      .join('');
    printReport(
      `Staff advances · ${staffAdvView === 'day' ? scope : monthLabel(scope)}`,
      `<table><thead><tr><th>Date</th><th>Code</th><th>Name</th><th>Role</th><th>Comment</th><th>Amount</th></tr></thead><tbody>${body}</tbody></table>`
    );
  }

  $('#staffSalMonth')?.addEventListener('change', () => {
    staffSalYm = $('#staffSalMonth').value;
    if ($('#staffSalMonthLabel')) $('#staffSalMonthLabel').textContent = monthLabel(staffSalYm);
    tableUI.staffsalary.page = 1;
    tableUI.staffadvances.page = 1;
    renderStaffSalaryPage();
  });
  $('#staffSalMonthPrev')?.addEventListener('click', () => goStaffSalMonth(-1));
  $('#staffSalMonthNext')?.addEventListener('click', () => goStaffSalMonth(1));
  bindTableTools(['#staffSalSearch', '#staffSalSort', '#staffSalPageSize'], 'staffsalary', renderStaffPaySheet);
  bindTableTools(['#staffAdvSearch', '#staffAdvSort', '#staffAdvPageSize'], 'staffadvances', renderStaffAdvances);
  $('#staffSalExcel')?.addEventListener('click', () => exportStaffSalary('excel'));
  $('#staffSalPdf')?.addEventListener('click', () => exportStaffSalary('pdf'));
  $('#staffSalPaySelected')?.addEventListener('click', () => {
    openPayBatch(selectedStaffSalPeople(), 'Pay selected staff', ensureStaffSalMonthOptions());
  });
  $('#staffSalPayAll')?.addEventListener('click', () => {
    const ym = ensureStaffSalMonthOptions();
    openPayBatch(peopleForMonth(ym, 'Staff'), 'Pay all unpaid staff', ym);
  });
  $$('#staffSalMainTabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      staffSalTab = tab.dataset.sstab || 'pay';
      if (staffSalTab === 'adv' && staffAdvView === 'day' && !staffAdvDate) {
        staffAdvDate = today();
      }
      renderStaffSalaryPage();
    });
  });
  $$('#staffAdvViewTabs .party-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      staffAdvView = tab.dataset.savadv || 'month';
      if (staffAdvView === 'month' && staffAdvDate) staffSalYm = staffAdvDate.slice(0, 7);
      if (staffAdvView === 'day' && staffSalYm && !staffAdvDate) {
        staffAdvDate = `${staffSalYm}-01`;
      }
      tableUI.staffadvances.page = 1;
      renderStaffSalaryPage();
    });
  });
  $('#staffAdvDayPrev')?.addEventListener('click', () => goStaffAdvDay(-1));
  $('#staffAdvDayNext')?.addEventListener('click', () => goStaffAdvDay(1));
  $('#staffAdvDate')?.addEventListener('change', () => {
    staffAdvDate = $('#staffAdvDate').value || today();
    staffSalYm = staffAdvDate.slice(0, 7);
    tableUI.staffadvances.page = 1;
    renderStaffSalaryPage();
  });
  $('#staffAdvExcel')?.addEventListener('click', () => exportStaffAdvances('excel'));
  $('#staffAdvPdf')?.addEventListener('click', () => exportStaffAdvances('pdf'));
  $('#staffAdvGiveBtn')?.addEventListener('click', () =>
    openGiveAdvance(null, { staffOnly: true })
  );

  $('#hirePersonBtn')?.addEventListener('click', () => {
    openModal(
      'Hire — ' + activeQuarry().name,
      `<div class="form-grid cols-2">
        <label class="field"><span>Name</span><input id="hName" placeholder="Full name" /></label>
        <label class="field"><span>Category</span>
          <select id="hCat"><option value="Staff">Staff (monthly salary)</option><option value="Worker">Worker (daily wage)</option></select>
        </label>
        <label class="field"><span>Designation</span><input id="hDesig" placeholder="e.g. Crane o/p, Helper" /></label>
        <label class="field"><span>Join date</span><input type="date" id="hJoin" value="${today()}" /></label>
        <label class="field"><span>Monthly basic (Staff)</span><input type="number" id="hBasic" value="30000" /></label>
        <label class="field"><span>Daily rate (Worker)</span><input type="number" id="hDaily" value="700" /></label>
        <label class="field"><span>Bank name</span><input id="hBank" placeholder="CUB / TMB Melur" /></label>
        <label class="field"><span>A/c number</span><input id="hAc" placeholder="Account no" /></label>
        <label class="field" style="grid-column:1/-1"><span>IFSC</span><input id="hIfsc" placeholder="CIUB0000123" /></label>
      </div>`,
      () => {
        if (!$('#hName').value.trim()) {
          toast('Name required');
          return false;
        }
        const cat = $('#hCat').value;
        const join = $('#hJoin').value || today();
        const person = {
          id: uid(),
          name: $('#hName').value.trim(),
          designation: $('#hDesig').value.trim() || (cat === 'Worker' ? 'Worker' : 'Staff'),
          category: cat,
          basic: cat === 'Staff' ? Number($('#hBasic').value) || 0 : 0,
          dailyRate: cat === 'Worker' ? Number($('#hDaily').value) || 0 : 0,
          quarryId: state.activeQuarryId,
          joinDate: join,
          exitDate: null,
          exitReason: '',
          bankName: $('#hBank').value.trim(),
          bankAc: $('#hAc').value.trim(),
          ifsc: $('#hIfsc').value.trim(),
          employment: [{ kind: 'Join', date: join, note: 'Hired' }],
        };
        state.staff.push(person);
        toast('Hired · ' + cat);
        return true;
      }
    );
  });

  $('#exitPersonBtn')?.addEventListener('click', () => {
    const active = state.staff.filter((p) => p.quarryId === state.activeQuarryId && !p.exitDate);
    if (!active.length) {
      toast('No active people to exit');
      return;
    }
    openModal(
      'Mark exit',
      `<div class="form-grid">
        <label class="field"><span>Person</span>
          <select id="exPerson">${active.map((p) => `<option value="${p.id}">${p.name} (${p.category || 'Staff'} · ${p.designation || ''})</option>`).join('')}</select>
        </label>
        <label class="field"><span>Exit date</span><input type="date" id="exDate" value="${today()}" /></label>
        <label class="field"><span>Reason</span><input id="exReason" placeholder="Left / stopped suddenly" /></label>
      </div>`,
      () => {
        const p = state.staff.find((x) => x.id === $('#exPerson').value);
        if (!p) return false;
        p.exitDate = $('#exDate').value || today();
        p.exitReason = $('#exReason').value.trim() || 'Left';
        pushEmployment(p, 'Exit', p.exitDate, p.exitReason);
        toast(p.name + ' exited');
        return true;
      }
    );
  });

  /* Sales */
  function renderSales() {
    const marks = quarryMarkings();
    const totalCbm = marks.reduce((s, m) => s + volCBM(m), 0);
    const gross = marks.reduce((s, m) => s + markGross(m), 0);
    const gst = marks.reduce((s, m) => s + markGstAmt(m), 0);
    const total = gross + gst;
    const royalty = totalCbm * quarryRates().royaltyRate;
    $('#salesStats').innerHTML = `
      <div class="card"><h3>Blocks</h3><div class="stat">${marks.length}</div></div>
      <div class="card"><h3>Total CBM</h3><div class="stat">${cbm(totalCbm)}</div></div>
      <div class="card"><h3>Gross</h3><div class="stat">${money(gross)}</div></div>
      <div class="card"><h3>GST</h3><div class="stat warn">${money(gst)}</div></div>
      <div class="card"><h3>Total (incl. GST)</h3><div class="stat ok">${money(total)}</div></div>
      <div class="card"><h3>Royalty</h3><div class="stat warn">${money(royalty)}</div></div>`;
    const byGroup = new Map();
    marks.forEach((m) => {
      const key = `${m.partyId || '_none'}|${m.date || ''}`;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(m);
    });
    const partyDateGroups = [...byGroup.entries()]
      .map(([, rows]) => {
        const m0 = rows[0];
        const p = state.parties.find((x) => x.id === m0.partyId);
        const name = p?.name || '—';
        const date = m0.date || '—';
        rows.sort((a, b) => a.blockNo.localeCompare(b.blockNo));
        return { partyId: m0.partyId, name, date, rows };
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));

    $('#markingTable').innerHTML = marks.length
      ? partyDateGroups
          .map(({ name, date, rows }) => {
            const gCbm = rows.reduce((s, m) => s + volCBM(m), 0);
            const gGross = rows.reduce((s, m) => s + markGross(m), 0);
            const gGst = rows.reduce((s, m) => s + markGstAmt(m), 0);
            const head = `<tr class="group-head">
              <td colspan="3"><strong>${name}</strong> <span class="group-meta">${date} · ${rows.length} block${rows.length === 1 ? '' : 's'}</span></td>
              <td class="num">${cbm(gCbm)}</td>
              <td></td>
              <td class="num">${money(gGross)}</td>
              <td></td>
              <td class="num">${money(gGst)}</td>
              <td class="num">${money(gGross + gGst)}</td>
              <td></td>
            </tr>`;
            const body = rows
              .map((m) => {
                const v = volCBM(m);
                const g = markGross(m);
                const tax = markGstAmt(m);
                return `<tr class="group-row">
                  <td>${m.blockNo}</td>
                  <td>${m.choice || '—'}</td>
                  <td>${m.l}×${m.w}×${m.h}</td><td class="num">${cbm(v)}</td>
                  <td class="num">${money(m.rate)}</td>
                  <td class="num">${money(g)}</td>
                  <td class="num">${markGstPct(m)}%</td>
                  <td class="num">${money(tax)}</td>
                  <td class="num">${money(g + tax)}</td>
                  <td><span class="badge ${m.load === 'OK' ? 'ok' : 'warn'}">${m.load}</span></td>
                </tr>`;
              })
              .join('');
            return head + body;
          })
          .join('')
      : `<tr><td colspan="10"><div class="empty">No markings for ${contextLabel()}</div></td></tr>`;
  }

  function choiceSelectHtml(selected = 'I') {
    const opts = ['I', 'II', 'III', 'Mix', 'Other'];
    return `<select class="m-choice">${opts
      .map((c) => `<option value="${c}"${c === selected ? ' selected' : ''}>${c}</option>`)
      .join('')}</select>`;
  }

  function openMarkingBatch() {
    const buyers = state.parties.filter((p) => isCustomerParty(p));
    if (!buyers.length) {
      toast('Add a buyer party first');
      return;
    }
    const partyOpts = buyers
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => `<option value="${p.id}">${p.name}</option>`)
      .join('');
    const defGst = quarryRates().gstPct;
    const defRate = defaultCbmRate('I');

    const lineRow = (defaults = {}) => {
      const rate = defaults.rate != null ? defaults.rate : defRate;
      const l = defaults.l != null ? defaults.l : 300;
      const w = defaults.w != null ? defaults.w : 150;
      const h = defaults.h != null ? defaults.h : 120;
      const load = defaults.load || 'OK';
      const choice = defaults.choice || 'I';
      const gstPct = defaults.gstPct != null ? defaults.gstPct : defGst;
      return `<tr class="m-line">
        <td><input class="m-block" placeholder="Block no" /></td>
        <td>${choiceSelectHtml(choice)}</td>
        <td><input type="number" class="m-l" value="${l}" min="1" /></td>
        <td><input type="number" class="m-w" value="${w}" min="1" /></td>
        <td><input type="number" class="m-h" value="${h}" min="1" /></td>
        <td><input type="number" class="m-rate" value="${rate}" min="0" /></td>
        <td><input type="number" class="m-gst" value="${gstPct}" min="0" step="0.01" /></td>
        <td><select class="m-load"><option${load === 'OK' ? ' selected' : ''}>OK</option><option${load === 'Pending' ? ' selected' : ''}>Pending</option></select></td>
        <td class="num m-cbm">—</td>
        <td class="num m-gross">—</td>
        <td class="num m-gstamt">—</td>
        <td class="num m-total">—</td>
        <td><button type="button" class="btn btn-ghost btn-sm m-rm" title="Remove line">✕</button></td>
      </tr>`;
    };

    openModal(
      'Add markings — ' + activeQuarry().name,
      `<div class="marking-batch">
        <div class="form-grid cols-4">
          <label class="field"><span>Date</span><input type="date" id="mDate" value="${today()}" /></label>
          <label class="field"><span>Party</span><select id="mParty">${partyOpts}</select></label>
          <label class="field"><span>Default rate / CBM</span><input type="number" id="mDefRate" value="${defRate}" /></label>
          <label class="field"><span>Default GST %</span><input type="number" id="mDefGst" value="${defGst}" min="0" step="0.01" /></label>
        </div>
        <p style="color:var(--muted);font-size:.85rem;margin:10px 0 8px">Add all blocks for this party on this date. Empty block-no rows are skipped. Gross = CBM × rate; Total = Gross + GST.</p>
        <div class="table-wrap marking-lines-wrap">
          <table class="marking-lines">
            <thead>
              <tr>
                <th>Block no</th><th>Choice</th><th>L</th><th>W</th><th>H</th>
                <th>Rate</th><th>GST%</th><th>Load</th>
                <th class="num">CBM</th><th class="num">Gross</th><th class="num">GST</th><th class="num">Total</th><th></th>
              </tr>
            </thead>
            <tbody id="mLinesBody">
              ${lineRow()}${lineRow()}${lineRow()}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="8"><strong>Total</strong></td>
                <td class="num" id="mSumCbm">—</td>
                <td class="num" id="mSumGross">—</td>
                <td class="num" id="mSumGst">—</td>
                <td class="num" id="mSumTotal">—</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-ghost btn-sm" id="mAddLine">+ Add line</button>
          <button type="button" class="btn btn-ghost btn-sm" id="mApplyRate">Apply default rate</button>
          <button type="button" class="btn btn-ghost btn-sm" id="mApplyGst">Apply default GST %</button>
        </div>
      </div>`,
      () => {
        const date = $('#mDate').value;
        const partyId = $('#mParty').value;
        if (!date) {
          toast('Date required');
          return false;
        }
        if (!partyId) {
          toast('Select party');
          return false;
        }
        const saved = [];
        $$('#mLinesBody tr.m-line').forEach((tr) => {
          const blockNo = tr.querySelector('.m-block')?.value.trim();
          if (!blockNo) return;
          const l = Number(tr.querySelector('.m-l')?.value) || 0;
          const w = Number(tr.querySelector('.m-w')?.value) || 0;
          const h = Number(tr.querySelector('.m-h')?.value) || 0;
          const rate = Number(tr.querySelector('.m-rate')?.value) || 0;
          const gstPct = Number(tr.querySelector('.m-gst')?.value);
          if (l <= 0 || w <= 0 || h <= 0) return;
          saved.push({
            id: uid(),
            quarryId: state.activeQuarryId,
            date,
            partyId,
            blockNo,
            choice: tr.querySelector('.m-choice')?.value || 'I',
            l,
            w,
            h,
            rate,
            gstPct: Number.isFinite(gstPct) ? gstPct : defGst,
            load: tr.querySelector('.m-load')?.value || 'OK',
          });
        });
        if (!saved.length) {
          toast('Enter at least one block (block no + L×W×H)');
          return false;
        }
        saved.forEach((m) => state.markings.push(m));
        const partyName = state.parties.find((p) => p.id === partyId)?.name || 'party';
        toast(`${saved.length} markings · ${partyName} · ${date}`);
        return true;
      },
      { xlarge: true }
    );

    const recalcLine = (tr) => {
      const l = Number(tr.querySelector('.m-l')?.value) || 0;
      const w = Number(tr.querySelector('.m-w')?.value) || 0;
      const h = Number(tr.querySelector('.m-h')?.value) || 0;
      const rate = Number(tr.querySelector('.m-rate')?.value) || 0;
      const gstPct = Number(tr.querySelector('.m-gst')?.value) || 0;
      const v = (l * w * h) / 1e6;
      const gross = v * rate;
      const tax = gross * (gstPct / 100);
      const ok = l && w && h;
      const set = (sel, txt) => {
        const el = tr.querySelector(sel);
        if (el) el.textContent = txt;
      };
      set('.m-cbm', ok ? cbm(v) : '—');
      set('.m-gross', ok ? money(gross) : '—');
      set('.m-gstamt', ok ? money(tax) : '—');
      set('.m-total', ok ? money(gross + tax) : '—');
    };
    const recalcAll = () => {
      let tc = 0;
      let tg = 0;
      let tx = 0;
      $$('#mLinesBody tr.m-line').forEach((tr) => {
        recalcLine(tr);
        const l = Number(tr.querySelector('.m-l')?.value) || 0;
        const w = Number(tr.querySelector('.m-w')?.value) || 0;
        const h = Number(tr.querySelector('.m-h')?.value) || 0;
        const rate = Number(tr.querySelector('.m-rate')?.value) || 0;
        const gstPct = Number(tr.querySelector('.m-gst')?.value) || 0;
        if (!tr.querySelector('.m-block')?.value.trim()) return;
        if (l && w && h) {
          const v = (l * w * h) / 1e6;
          const gross = v * rate;
          tc += v;
          tg += gross;
          tx += gross * (gstPct / 100);
        }
      });
      if ($('#mSumCbm')) $('#mSumCbm').textContent = tc ? cbm(tc) : '—';
      if ($('#mSumGross')) $('#mSumGross').textContent = tg ? money(tg) : '—';
      if ($('#mSumGst')) $('#mSumGst').textContent = tx ? money(tx) : '—';
      if ($('#mSumTotal')) $('#mSumTotal').textContent = tg || tx ? money(tg + tx) : '—';
    };
    const wireLine = (tr) => {
      tr.querySelectorAll('input, select').forEach((el) => el.addEventListener('input', recalcAll));
      tr.querySelectorAll('input, select').forEach((el) => el.addEventListener('change', recalcAll));
      tr.querySelector('.m-choice')?.addEventListener('change', () => {
        const rateEl = tr.querySelector('.m-rate');
        if (rateEl) rateEl.value = defaultCbmRate(tr.querySelector('.m-choice').value);
        recalcAll();
      });
      tr.querySelector('.m-rm')?.addEventListener('click', () => {
        if ($$('#mLinesBody tr.m-line').length <= 1) {
          tr.querySelector('.m-block').value = '';
          recalcAll();
          return;
        }
        tr.remove();
        recalcAll();
      });
    };
    $$('#mLinesBody tr.m-line').forEach(wireLine);
    recalcAll();

    $('#mAddLine')?.addEventListener('click', () => {
      const defRate = Number($('#mDefRate')?.value) || 18000;
      const gstPct = Number($('#mDefGst')?.value);
      $('#mLinesBody').insertAdjacentHTML(
        'beforeend',
        lineRow({ rate: defRate, gstPct: Number.isFinite(gstPct) ? gstPct : defGst })
      );
      const tr = $('#mLinesBody').lastElementChild;
      wireLine(tr);
      tr.querySelector('.m-block')?.focus();
      recalcAll();
    });
    $('#mApplyRate')?.addEventListener('click', () => {
      const defRate = Number($('#mDefRate')?.value) || 0;
      $$('#mLinesBody .m-rate').forEach((inp) => {
        inp.value = defRate;
      });
      recalcAll();
      toast('Default rate applied');
    });
    $('#mApplyGst')?.addEventListener('click', () => {
      const g = Number($('#mDefGst')?.value) || 0;
      $$('#mLinesBody .m-gst').forEach((inp) => {
        inp.value = g;
      });
      recalcAll();
      toast('Default GST % applied');
    });
  }

  $('#addMarkingBtn').addEventListener('click', openMarkingBatch);

  let selectedCustomerId = null;
  let selectedVendorId = null;
  let partyProfileExpanded = false;

  function quarryPartyLedger() {
    return (state.partyLedger || []).filter((e) => e.quarryId === state.activeQuarryId);
  }

  function isVendorParty(p) {
    return p && (p.type === 'Vendor' || p.type === 'Both');
  }

  function isCustomerParty(p) {
    return p && (p.type === 'Customer' || p.type === 'Buyer' || p.type === 'Both' || !p.type);
  }

  function partyTypeLabel(p) {
    if (!p) return 'Customer';
    if (p.type === 'Vendor') return 'Vendor';
    if (p.type === 'Both') return 'Customer + Vendor';
    return 'Customer';
  }

  function partyTransactions(partyId) {
    const party = state.parties.find((p) => p.id === partyId);
    const vendor = isVendorParty(party);
    const txns = [];

    quarryExpenses()
      .filter((e) => e.partyId === partyId && !e.machineLedgerId)
      .forEach((e) => {
        const rawDebit = e.type === 'Debit' ? Number(e.debit) || 0 : 0;
        const rawCredit = e.type === 'Credit' ? Number(e.credit) || 0 : 0;
        let debit = rawDebit;
        let credit = rawCredit;
        let signed;
        if (vendor) {
          signed = rawDebit ? -rawDebit : rawCredit;
        } else if (e.type === 'Credit') {
          // Customer receipt reduces receivable (show as Debit against sale Cr)
          debit = rawCredit;
          credit = 0;
          signed = -rawCredit;
        } else {
          signed = -rawDebit;
        }
        const amt = debit || credit;
        txns.push({
          id: e.id,
          type: e.type,
          date: e.date,
          particulars: e.particulars,
          head: e.head,
          debit,
          credit,
          amount: amt,
          signed,
          source: 'cash',
          kind:
            !vendor && e.type === 'Credit'
              ? e.markingId
                ? 'Sale receipt'
                : 'Receipt'
              : e.type === 'Debit' && vendor
                ? 'Payment'
                : e.type,
        });
      });

    quarryPartyLedger()
      .filter((e) => e.partyId === partyId)
      .forEach((e) => {
        const debit = Number(e.debit) || 0;
        const credit = Number(e.credit) || 0;
        const amt = debit || credit;
        const signed = credit - debit; // bill ↑ pending, payment ↓
        txns.push({
          id: e.id,
          type: credit ? 'Credit' : 'Debit',
          date: e.date,
          particulars: e.particulars,
          head: e.kind || 'Ledger',
          debit,
          credit,
          amount: amt,
          signed,
          source: 'partyLedger',
          kind: e.kind || (credit ? 'Bill' : 'Payment'),
        });
      });

    // Machinery rent/payments for same vendor
    quarryMachineLedger()
      .filter((e) => e.vendorId === partyId)
      .forEach((e) => {
        const debit = Number(e.debit) || 0;
        const credit = Number(e.credit) || 0;
        const amt = debit || credit;
        txns.push({
          id: e.id,
          type: credit ? 'Credit' : 'Debit',
          date: e.date,
          particulars: e.particulars,
          head: e.kind || 'Machinery',
          debit,
          credit,
          amount: amt,
          signed: credit - debit,
          source: 'machine',
          kind: e.kind || (credit ? 'Rent' : 'Payment'),
        });
      });

    if (!vendor) {
      quarryMarkings()
        .filter((m) => m.partyId === partyId)
        .forEach((m) => {
          const amt = markTotal(m);
          txns.push({
            id: m.id,
            type: 'Marking',
            date: m.date,
            particulars: `Block ${m.blockNo}${m.choice ? ' · ' + m.choice : ''} · ${cbm(volCBM(m))} CBM · GST ${markGstPct(m)}%`,
            head: 'Block Marking',
            debit: 0,
            credit: amt,
            amount: amt,
            signed: amt,
            source: 'marking',
            kind: 'Marking',
          });
        });
    }

    txns.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
    let bal = 0;
    return txns.map((t) => {
      bal += t.signed;
      return { ...t, balance: bal };
    });
  }

  function partyBalance(partyId) {
    const rows = partyTransactions(partyId);
    return rows.length ? rows[rows.length - 1].balance : 0;
  }

  function partyPendingLabel(partyId) {
    const party = state.parties.find((p) => p.id === partyId);
    const bal = partyBalance(partyId);
    if (isVendorParty(party)) {
      // positive = you owe vendor
      return { text: money(Math.abs(bal)), hint: bal > 0 ? 'Pending' : bal < 0 ? 'Advance' : '', cls: bal > 0 ? 'neg' : bal < 0 ? 'pos' : '' };
    }
    return {
      text: money(Math.abs(bal)),
      hint: bal < 0 ? 'Dr' : bal > 0 ? 'Cr' : '',
      cls: bal < 0 ? 'neg' : bal > 0 ? 'pos' : '',
    };
  }

  function partyListForScope(scope) {
    const isVendor = scope === 'vendor';
    const q = ($(isVendor ? '#vendorSearch' : '#customerSearch')?.value || '').toLowerCase().trim();
    const filter = $(isVendor ? '#vendorFilter' : '#customerFilter')?.value || 'all';
    const sort = $(isVendor ? '#vendorSort' : '#customerSort')?.value || 'name';
    let list = [...state.parties];
    if (isVendor) list = list.filter((p) => isVendorParty(p));
    else list = list.filter((p) => isCustomerParty(p) && p.type !== 'Vendor');
    if (q) {
      list = list.filter((p) =>
        `${p.name} ${p.phone || ''} ${p.gstin || ''} ${p.state || ''}`.toLowerCase().includes(q)
      );
    }
    if (filter === 'pending') {
      list = list.filter((p) => {
        const bal = partyBalance(p.id);
        return isVendor ? bal > 0 : bal !== 0;
      });
    } else if (filter === 'advance') {
      list = list.filter((p) => partyBalance(p.id) < 0);
    } else if (filter === 'zero') {
      list = list.filter((p) => partyBalance(p.id) === 0);
    }
    list.sort((a, b) => {
      if (sort === 'bal-desc') return Math.abs(partyBalance(b.id)) - Math.abs(partyBalance(a.id));
      if (sort === 'bal-asc') return Math.abs(partyBalance(a.id)) - Math.abs(partyBalance(b.id));
      return a.name.localeCompare(b.name);
    });
    return list;
  }

  function renderPartyList(scope) {
    const isVendor = scope === 'vendor';
    const list = partyListForScope(scope);
    const key = isVendor ? 'vendors' : 'customers';
    const page = slicePage(list, key, isVendor ? '#vendorPageSize' : '#customerPageSize');
    const cell = (v) => (v ? String(v) : '—');

    let pendingN = 0;
    let settledN = 0;
    let balSum = 0;
    list.forEach((p) => {
      const bal = partyBalance(p.id);
      balSum += bal;
      if (isVendor ? bal > 0 : bal !== 0) pendingN += 1;
      else settledN += 1;
    });
    const statsEl = $(isVendor ? '#vendorStats' : '#customerStats');
    if (statsEl) {
      statsEl.innerHTML = isVendor
        ? `
        <div class="card"><h3>Total</h3><div class="stat">${list.length}</div><div class="hint">${activeQuarry().name}</div></div>
        <div class="card"><h3>Pending</h3><div class="stat ${pendingN ? 'warn' : ''}">${pendingN}</div></div>
        <div class="card"><h3>Settled</h3><div class="stat ok">${settledN}</div></div>
        <div class="card"><h3>Payable</h3><div class="stat ${balSum > 0 ? 'neg' : ''}">${money(Math.abs(balSum))}</div><div class="hint">${balSum > 0 ? 'Owed' : balSum < 0 ? 'Advance' : '—'}</div></div>`
        : `
        <div class="card"><h3>Total</h3><div class="stat">${list.length}</div><div class="hint">${activeQuarry().name}</div></div>
        <div class="card"><h3>With balance</h3><div class="stat ${pendingN ? 'warn' : ''}">${pendingN}</div></div>
        <div class="card"><h3>Settled</h3><div class="stat ok">${settledN}</div></div>
        <div class="card"><h3>Net bal</h3><div class="stat">${money(Math.abs(balSum))}</div><div class="hint">${balSum > 0 ? 'Cr' : balSum < 0 ? 'Dr' : '—'}</div></div>`;
    }

    const tbody = $(isVendor ? '#vendorTable' : '#customerTable');
    if (tbody) {
      tbody.innerHTML = page.rows.length
        ? page.rows
            .map((p) => {
              const pend = partyPendingLabel(p.id);
              return `<tr data-party-row="${p.id}" style="cursor:pointer">
                <td><strong>${p.name}</strong></td>
                <td>${cell(p.phone)}</td>
                <td>${cell(p.gstin)}</td>
                <td>${cell(p.state)}</td>
                <td class="num ${pend.cls}">${pend.text}${pend.hint ? ' ' + pend.hint : ''}</td>
                <td><button type="button" class="btn btn-ghost btn-sm" data-party-edit="${p.id}">Edit</button></td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="6"><div class="empty">No ${isVendor ? 'vendors' : 'customers'}</div></td></tr>`;
      $$(`${isVendor ? '#vendorTable' : '#customerTable'} [data-party-row]`).forEach((tr) =>
        tr.addEventListener('click', (e) => {
          if (e.target.closest('[data-party-edit]')) return;
          go(isVendor ? 'vendor' : 'customer', { partyId: tr.dataset.partyRow });
        })
      );
      $$(`${isVendor ? '#vendorTable' : '#customerTable'} [data-party-edit]`).forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditPartyModal(b.dataset.partyEdit);
        })
      );
    }
    renderPager($(isVendor ? '#vendorPager' : '#customerPager'), key, page, () =>
      renderPartyList(scope)
    );
  }

  function renderPartyDetail(scope) {
    const isVendor = scope === 'vendor';
    const partyId = isVendor ? selectedVendorId : selectedCustomerId;
    const party = state.parties.find((p) => p.id === partyId);
    if (!party) {
      go(isVendor ? 'vendors' : 'customers');
      return;
    }
    const pend = partyPendingLabel(party.id);
    const vendor = isVendorParty(party);
    if ($(isVendor ? '#vendorDetailTitle' : '#customerDetailTitle')) {
      $(isVendor ? '#vendorDetailTitle' : '#customerDetailTitle').textContent = party.name;
    }
    if ($(isVendor ? '#vendorDetailSub' : '#customerDetailSub')) {
      $(isVendor ? '#vendorDetailSub' : '#customerDetailSub').innerHTML = `${partyTypeLabel(party)}${party.phone ? ' · ' + party.phone : ''}${party.gstin && party.gstin !== '—' ? ' · ' + party.gstin : ''}`;
    }
    if ($(isVendor ? '#vendorDetailBal' : '#customerDetailBal')) {
      $(isVendor ? '#vendorDetailBal' : '#customerDetailBal').innerHTML = `
        <small>${vendor ? 'Pending' : 'Closing balance'}</small>
        <strong class="${pend.cls}">${pend.text}${pend.hint ? ' ' + pend.hint : ''}</strong>`;
    }

    const profileEl = $(isVendor ? '#vendorDetailProfile' : '#customerDetailProfile');
    if (profileEl) {
      const initials = (party.name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
      const row = (label, v, wide) =>
        `<div class="staff-row${wide ? ' wide' : ''}"><dt>${label}</dt><dd${v ? '' : ' class="empty"'}>${v || '—'}</dd></div>`;
      const expanded = partyProfileExpanded;
      profileEl.innerHTML = `
        <div class="staff-profile">
          <div class="staff-profile-hero">
            <div class="staff-avatar" aria-hidden="true">${initials}</div>
            <div class="staff-profile-hero-main">
              <h3>${party.name}</h3>
              <div class="staff-profile-meta">
                <span class="badge ok">${partyTypeLabel(party)}</span>
                ${party.contact ? `<span style="color:var(--muted);font-size:.8rem">${party.contact}</span>` : ''}
              </div>
            </div>
            <div class="staff-profile-pay">
              <small>${vendor ? 'Pending' : 'Balance'}</small>
              <strong class="${pend.cls}">${pend.text}${pend.hint ? ' ' + pend.hint : ''}</strong>
            </div>
          </div>
          <dl class="staff-profile-dl">
            ${row('Phone', party.phone)}
            ${row('GSTIN', party.gstin === '—' ? '' : party.gstin)}
            ${row('State', party.state)}
            ${
              expanded
                ? `${row('Email', party.email)}
            ${row('GST type', party.gstType)}
            ${row('Credit limit', party.creditLimit ? money(party.creditLimit) : '')}
            ${row('Opening bal', party.openingBalance ? money(party.openingBalance) : '')}
            ${row('As of', party.asOf)}
            ${row('Contact', party.contact)}
            ${row('Billing', party.billingAddress, true)}
            ${row('Shipping', party.shippingAddress, true)}
            ${row('Notes', party.notes, true)}`
                : ''
            }
          </dl>
          <div class="staff-profile-toggle-wrap">
            <button type="button" class="btn btn-ghost btn-sm" id="partyProfileToggle">
              ${expanded ? 'Hide full details' : 'See full details'}
            </button>
          </div>
        </div>`;
      $('#partyProfileToggle')?.addEventListener('click', () => {
        partyProfileExpanded = !partyProfileExpanded;
        renderPartyDetail(scope);
      });
    }

    const allTxns = partyTransactions(party.id);
    let txns = allTxns.slice().reverse();
    const tq = ($(isVendor ? '#vendorTxnSearch' : '#customerTxnSearch')?.value || '').toLowerCase().trim();
    if (tq) {
      txns = txns.filter((t) =>
        `${t.type} ${t.particulars} ${t.head} ${t.date} ${t.kind || ''}`.toLowerCase().includes(tq)
      );
    }

    const totalDebit = allTxns.reduce((a, t) => a + (Number(t.debit) || 0), 0);
    const totalCredit = allTxns.reduce((a, t) => a + (Number(t.credit) || 0), 0);
    const closing = allTxns.length ? allTxns[allTxns.length - 1].balance : 0;
    const balText = vendor
      ? `${money(Math.abs(closing))}${closing > 0 ? ' Pending' : closing < 0 ? ' Adv' : ''}`
      : `${money(Math.abs(closing))}${closing < 0 ? ' Dr' : closing > 0 ? ' Cr' : ''}`;
    const balCls = closing
      ? vendor
        ? closing > 0
          ? 'neg'
          : 'pos'
        : closing < 0
          ? 'neg'
          : 'pos'
      : '';
    const statsEl = $(isVendor ? '#vendorTxnStats' : '#customerTxnStats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="card"><h3>Total Debit</h3><div class="stat">${money(totalDebit)}</div><div class="hint">Payments / outflows</div></div>
        <div class="card"><h3>Total Credit</h3><div class="stat">${money(totalCredit)}</div><div class="hint">${vendor ? 'Bills / rent' : 'Markings / receipts'}</div></div>
        <div class="card"><h3>Transactions</h3><div class="stat">${allTxns.length}</div><div class="hint">All time</div></div>
        <div class="card"><h3>${vendor ? 'Pending' : 'Balance'}</h3><div class="stat ${balCls}">${balText || '—'}</div><div class="hint">Running close</div></div>`;
    }

    const balCell = (bal) => {
      const cls = bal
        ? vendor
          ? bal > 0
            ? 'neg'
            : 'pos'
          : bal < 0
            ? 'neg'
            : 'pos'
        : '';
      const hint = vendor
        ? bal > 0
          ? ' Pending'
          : bal < 0
            ? ' Adv'
            : ''
        : bal < 0
          ? ' Dr'
          : bal > 0
            ? ' Cr'
            : '';
      return `<td class="num ${cls}">${money(Math.abs(bal))}${hint}</td>`;
    };

    const table = $(isVendor ? '#vendorTxnTable' : '#customerTxnTable');
    if (table) {
      table.innerHTML = txns.length
        ? txns
            .map(
              (t) => `<tr>
              <td><span class="badge ${t.type === 'Credit' || t.type === 'Marking' ? 'ok' : 'danger'}">${t.kind || t.type}</span></td>
              <td>${t.date}</td>
              <td>${t.particulars}<div class="s" style="color:var(--muted);font-size:.72rem">${t.head}</div></td>
              <td class="num">${t.debit ? money(t.debit) : '—'}</td>
              <td class="num">${t.credit ? money(t.credit) : '—'}</td>
              ${balCell(t.balance)}
            </tr>`
            )
            .join('')
        : `<tr><td colspan="6"><div class="empty">No transactions for ${party.name}</div></td></tr>`;
    }
  }

  function renderCustomers() {
    renderPartyList('customer');
  }

  function renderVendors() {
    renderPartyList('vendor');
  }

  function renderCustomerDetail() {
    renderPartyDetail('customer');
  }

  function renderVendorDetail() {
    renderPartyDetail('vendor');
  }

  function exportPartyList(scope) {
    const isVendor = scope === 'vendor';
    const list = partyListForScope(scope);
    downloadCsv(`${isVendor ? 'vendors' : 'customers'}-${activeQuarry().code}.csv`, [
      ['Name', 'Phone', 'GSTIN', 'State', 'Type', isVendor ? 'Pending' : 'Balance'],
      ...list.map((p) => {
        const bal = partyBalance(p.id);
        return [p.name, p.phone || '', p.gstin || '', p.state || '', partyTypeLabel(p), bal];
      }),
    ]);
    toast((isVendor ? 'Vendors' : 'Customers') + ' exported');
  }

  function exportPartyTxns(kind, scope) {
    const isVendor = scope === 'vendor';
    const partyId = isVendor ? selectedVendorId : selectedCustomerId;
    const party = state.parties.find((p) => p.id === partyId);
    if (!party) {
      toast(isVendor ? 'Select a vendor' : 'Select a customer');
      return;
    }
    const rows = partyTransactions(party.id);
    const label = isVendor ? 'vendor' : 'customer';
    const balExport = (bal) => {
      if (isVendor) {
        return `${Math.abs(bal)}${bal > 0 ? ' Pending' : bal < 0 ? ' Adv' : ''}`;
      }
      return `${Math.abs(bal)}${bal < 0 ? ' Dr' : bal > 0 ? ' Cr' : ''}`;
    };
    if (kind === 'excel') {
      downloadCsv(
        `${label}-${party.name.replace(/\s+/g, '-')}-${activeQuarry().code}.csv`,
        [
          ['Type', 'Date', 'Comment', 'Category', 'Debit', 'Credit', 'Balance'],
          ...rows.map((t) => [
            t.kind || t.type,
            t.date,
            t.particulars,
            t.head,
            t.debit || '',
            t.credit || '',
            balExport(t.balance),
          ]),
        ]
      );
      toast('Excel downloaded');
      return;
    }
    const body = rows
      .map(
        (t) =>
          `<tr><td>${t.kind || t.type}</td><td>${t.date}</td><td>${t.particulars}</td><td class="num">${t.debit ? money(t.debit) : '—'}</td><td class="num">${t.credit ? money(t.credit) : '—'}</td><td class="num">${money(Math.abs(t.balance))}${
            isVendor
              ? t.balance > 0
                ? ' Pending'
                : t.balance < 0
                  ? ' Adv'
                  : ''
              : t.balance < 0
                ? ' Dr'
                : t.balance > 0
                  ? ' Cr'
                  : ''
          }</td></tr>`
      )
      .join('');
    printReport(
      `${isVendor ? 'Vendor' : 'Customer'} statement · ${party.name}`,
      `<table><thead><tr><th>Type</th><th>Date</th><th>Comment</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>${body || '<tr><td colspan="6">No transactions</td></tr>'}</tbody></table>`
    );
  }

  $('#addCustomerBtn')?.addEventListener('click', () =>
    openAddPartyModal({
      defaultType: 'Customer',
      onSaved: (party) => {
        selectedCustomerId = party.id;
        go('customers');
      },
    })
  );
  $('#addVendorBtn')?.addEventListener('click', () =>
    openAddPartyModal({
      defaultType: 'Vendor',
      onSaved: (party) => {
        selectedVendorId = party.id;
        go('vendors');
      },
    })
  );
  $('#exportCustomersBtn')?.addEventListener('click', () => exportPartyList('customer'));
  $('#exportVendorsBtn')?.addEventListener('click', () => exportPartyList('vendor'));
  ['#customerSearch', '#customerFilter', '#customerSort', '#customerPageSize'].forEach((sel) => {
    $(sel)?.addEventListener(sel.includes('Search') ? 'input' : 'change', () => {
      if (sel.includes('PageSize') || sel.includes('Filter') || sel.includes('Sort') || sel.includes('Search')) {
        if (!sel.includes('Search')) tableUI.customers.page = 1;
        if (sel.includes('Search')) tableUI.customers.page = 1;
        renderCustomers();
      }
    });
  });
  ['#vendorSearch', '#vendorFilter', '#vendorSort', '#vendorPageSize'].forEach((sel) => {
    $(sel)?.addEventListener(sel.includes('Search') ? 'input' : 'change', () => {
      tableUI.vendors.page = 1;
      renderVendors();
    });
  });
  $('#customerDetailBack')?.addEventListener('click', () => go('customers'));
  $('#vendorDetailBack')?.addEventListener('click', () => go('vendors'));
  $('#customerDetailEditBtn')?.addEventListener('click', () => {
    if (selectedCustomerId) openEditPartyModal(selectedCustomerId);
  });
  $('#vendorDetailEditBtn')?.addEventListener('click', () => {
    if (selectedVendorId) openEditPartyModal(selectedVendorId);
  });
  $('#customerDetailDeleteBtn')?.addEventListener('click', () => {
    if (selectedCustomerId) deletePartyPerson(selectedCustomerId);
  });
  $('#vendorDetailDeleteBtn')?.addEventListener('click', () => {
    if (selectedVendorId) deletePartyPerson(selectedVendorId);
  });
  $('#customerTxnSearch')?.addEventListener('input', renderCustomerDetail);
  $('#vendorTxnSearch')?.addEventListener('input', renderVendorDetail);
  $('#customerDetailExcel')?.addEventListener('click', () => exportPartyTxns('excel', 'customer'));
  $('#customerDetailPdf')?.addEventListener('click', () => exportPartyTxns('pdf', 'customer'));
  $('#vendorDetailExcel')?.addEventListener('click', () => exportPartyTxns('excel', 'vendor'));
  $('#vendorDetailPdf')?.addEventListener('click', () => exportPartyTxns('pdf', 'vendor'));

  function openPartyBill() {
    const party = state.parties.find((p) => p.id === selectedVendorId);
    if (!party || !isVendorParty(party)) return;
    openModal(
      'Vendor bill — ' + party.name,
      `<div class="form-grid cols-2">
        <label class="field"><span>Date</span><input type="date" id="vbDate" value="${today()}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="vbAmt" min="0" value="" autofocus /></label>
        <label class="field" style="grid-column:1/-1"><span>Particulars</span>
          <input id="vbPart" placeholder="e.g. Explosive bill — August" value="Bill — ${party.name}" />
        </label>
        <p style="grid-column:1/-1;color:var(--muted);font-size:.85rem;margin:0">Posts <strong>Credit</strong> on vendor ledger (increases pending). No cash entry.</p>
      </div>`,
      () => {
        const amt = Number($('#vbAmt').value) || 0;
        if (amt <= 0) {
          toast('Amount required');
          return false;
        }
        if (!state.partyLedger) state.partyLedger = [];
        state.partyLedger.push({
          id: uid(),
          quarryId: state.activeQuarryId,
          partyId: party.id,
          date: $('#vbDate').value || today(),
          particulars: ($('#vbPart').value || '').trim() || `Bill — ${party.name}`,
          debit: 0,
          credit: amt,
          kind: 'Bill',
        });
        toast('Bill posted · pending updated');
        return true;
      }
    );
  }

  function openPartyPayment() {
    const party = state.parties.find((p) => p.id === selectedVendorId);
    if (!party || !isVendorParty(party)) return;
    openModal(
      'Vendor payment — ' + party.name,
      `<div class="form-grid cols-2">
        <label class="field"><span>Date</span><input type="date" id="vpDate" value="${today()}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="vpAmt" min="0" value="" autofocus /></label>
        <label class="field" style="grid-column:1/-1"><span>Particulars</span>
          <input id="vpPart" placeholder="Cash paid" value="Cash paid — ${party.name}" />
        </label>
        <p style="grid-column:1/-1;color:var(--muted);font-size:.85rem;margin:0">Posts cash <strong>Debit</strong> + reduces vendor pending.</p>
      </div>`,
      () => {
        const amt = Number($('#vpAmt').value) || 0;
        if (amt <= 0) {
          toast('Amount required');
          return false;
        }
        const date = $('#vpDate').value || today();
        const part = ($('#vpPart').value || '').trim() || `Cash paid — ${party.name}`;
        state.expenses.push({
          id: uid(),
          quarryId: state.activeQuarryId,
          date,
          type: 'Debit',
          head: 'Vendor Payment',
          particulars: part,
          debit: amt,
          credit: 0,
          partyId: party.id,
        });
        toast('Payment saved · pending updated');
        return true;
      }
    );
  }

  $('#vendorBillBtn')?.addEventListener('click', openPartyBill);
  $('#vendorPayBtn')?.addEventListener('click', openPartyPayment);

  function seedLoansFallback() {
    return [
      { id: 'ln1', vehicleNo: 'Lorry-TN88H8977', borrower: 'Sibi', loanNo: 'MELRB-2601230002', informDay: 3, dueDay: 5, bank: 'FEDRAL', emiAmount: 91144, active: true },
      { id: 'ln2', vehicleNo: 'PRD-500', borrower: 'Arun', loanNo: 'MELRB-2412230004', informDay: 3, dueDay: 5, bank: 'CUB', emiAmount: 111868, active: true },
      { id: 'ln3', vehicleNo: 'Car- High cross', borrower: 'Arun', loanNo: 'MELRB-2303090005', informDay: 8, dueDay: 10, bank: 'AXIS', emiAmount: 57000, active: true },
      { id: 'ln4', vehicleNo: 'Lorry-TN28BK7378', borrower: 'Rishi', loanNo: 'MELRB-2602120001', informDay: 7, dueDay: 10, bank: 'TMB', emiAmount: 91332, active: true },
      { id: 'ln5', vehicleNo: 'Kobalco-380', borrower: 'Rishi', loanNo: 'MELRB-2601230005', informDay: 7, dueDay: 10, bank: 'TMB', emiAmount: 188193, active: true },
      { id: 'ln6', vehicleNo: 'Hittachi-370', borrower: 'Arun', loanNo: 'MELRB-2511210002', informDay: 7, dueDay: 10, bank: 'CUB', emiAmount: 154164, active: true },
      { id: 'ln7', vehicleNo: 'PRD-250', borrower: 'Arun', loanNo: 'MELRB-2511210003', informDay: 7, dueDay: 10, bank: 'CUB', emiAmount: 90536, active: true },
      { id: 'ln8', vehicleNo: 'Hittachi-370 New', borrower: 'Kumar Stone', loanNo: 'MELRB-2602270005', informDay: 13, dueDay: 15, bank: 'TMB', emiAmount: 267571, active: true },
      { id: 'ln9', vehicleNo: 'Lorry-TN88L2691', borrower: 'Sibi', loanNo: 'MELRB-2607150002', informDay: 13, dueDay: 15, bank: 'FEDRAL', emiAmount: 95500, active: true },
      { id: 'ln10', vehicleNo: 'Car', borrower: 'MKB- Appa', loanNo: 'Sbi', informDay: 13, dueDay: 15, bank: 'TMB', emiAmount: 56000, active: true },
      { id: 'ln11', vehicleNo: 'Business- Loan', borrower: 'Arun', loanNo: 'MELRBTF-2505300001', informDay: 18, dueDay: 20, bank: 'CUB', emiAmount: 512000, active: true },
      { id: 'ln12', vehicleNo: 'Car', borrower: 'Saravanapriya', loanNo: 'Bank Of India', informDay: 23, dueDay: 25, bank: 'HDFC', emiAmount: 66000, active: true },
      { id: 'ln13', vehicleNo: 'Housing Loan', borrower: 'Arun', loanNo: 'Lvb', informDay: 3, dueDay: 5, bank: 'LVB', emiAmount: 30000, active: true },
    ];
  }

  function ensureFinanceMonthOptions() {
    const sel = $('#financeMonth');
    if (!sel) return;
    const opts = recentMonths(18);
    const prev = sel.value;
    if (!sel.dataset.filled || sel.dataset.qid !== state.activeQuarryId) {
      sel.innerHTML = opts.map((v) => `<option value="${v}">${monthLabel(v)}</option>`).join('');
      sel.dataset.filled = '1';
      sel.dataset.qid = state.activeQuarryId;
    }
    if (!prev || !opts.includes(prev)) sel.value = opts[0];
    else sel.value = prev;
    if (!sel.dataset.bound) {
      sel.dataset.bound = '1';
      sel.addEventListener('change', renderFinance);
    }
  }

  function loanPaymentFor(loanId, ym) {
    return (state.loanPayments || []).find((p) => p.loanId === loanId && p.ym === ym);
  }

  function loanStatus(loan, ym) {
    if (loanPaymentFor(loan.id, ym)) return { key: 'paid', label: 'Paid', cls: 'ok' };
    const [y, m] = ym.split('-').map(Number);
    const day = Number(loan.dueDay) || 1;
    const dueDate = new Date(y, m - 1, Math.min(day, daysInMonth(ym)));
    const informDay = Number(loan.informDay) || day;
    const informDate = new Date(y, m - 1, Math.min(informDay, daysInMonth(ym)));
    const now = new Date();
    const todayD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const viewingCurrent =
      ym === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (viewingCurrent) {
      if (todayD > dueDate) return { key: 'overdue', label: 'Overdue', cls: 'danger' };
      if (todayD >= informDate) return { key: 'due', label: 'Due soon', cls: 'warn' };
      return { key: 'upcoming', label: 'Upcoming', cls: '' };
    }
    // Past months unpaid
    const viewEnd = new Date(y, m, 0);
    if (viewEnd < todayD) return { key: 'overdue', label: 'Unpaid', cls: 'danger' };
    return { key: 'upcoming', label: 'Upcoming', cls: '' };
  }

  function openLoanForm(existing) {
    const L = existing || {};
    openModal(
      existing ? 'Edit loan' : 'Add loan',
      `<div class="form-grid cols-2">
        <label class="field"><span>Vehicle / asset</span><input id="lnVehicle" value="${(L.vehicleNo || '').replace(/"/g, '&quot;')}" placeholder="Lorry-TN88H8977" /></label>
        <label class="field"><span>Name</span><input id="lnName" value="${(L.borrower || '').replace(/"/g, '&quot;')}" placeholder="Borrower" /></label>
        <label class="field"><span>Loan number</span><input id="lnNo" value="${(L.loanNo || '').replace(/"/g, '&quot;')}" /></label>
        <label class="field"><span>Bank</span><input id="lnBank" value="${(L.bank || '').replace(/"/g, '&quot;')}" placeholder="CUB / TMB / AXIS" /></label>
        <label class="field"><span>Inform (day)</span><input type="number" id="lnInform" min="1" max="31" value="${L.informDay || 1}" /></label>
        <label class="field"><span>Due date (day)</span><input type="number" id="lnDue" min="1" max="31" value="${L.dueDay || 5}" /></label>
        <label class="field"><span>Due amount (EMI)</span><input type="number" id="lnAmt" min="0" value="${L.emiAmount || 0}" /></label>
        <label class="field"><span>Active</span>
          <select id="lnActive"><option value="1" ${L.active !== false ? 'selected' : ''}>Yes</option><option value="0" ${L.active === false ? 'selected' : ''}>No</option></select>
        </label>
      </div>`,
      () => {
        const vehicleNo = ($('#lnVehicle').value || '').trim();
        if (!vehicleNo) {
          toast('Vehicle / asset required');
          return false;
        }
        const row = {
          id: L.id || uid(),
          vehicleNo,
          borrower: ($('#lnName').value || '').trim() || '—',
          loanNo: ($('#lnNo').value || '').trim() || '—',
          bank: ($('#lnBank').value || '').trim() || '—',
          informDay: Number($('#lnInform').value) || 1,
          dueDay: Number($('#lnDue').value) || 1,
          emiAmount: Number($('#lnAmt').value) || 0,
          active: $('#lnActive').value === '1',
        };
        if (!state.loans) state.loans = [];
        if (existing) {
          const i = state.loans.findIndex((x) => x.id === existing.id);
          if (i >= 0) state.loans[i] = row;
        } else state.loans.push(row);
        toast(existing ? 'Loan updated' : 'Loan added');
        return true;
      },
      {
        onAfterSave: () => {
          if ($('.page.active')?.id === 'page-loandetail') renderLoanDetail();
          else renderFinance();
        },
      }
    );
  }

  function refreshLoanViews() {
    if ($('.page.active')?.id === 'page-loandetail') renderLoanDetail();
    else if ($('.page.active')?.id === 'page-finance') renderFinance();
  }

  function markLoanPaid(loanId) {
    const loan = (state.loans || []).find((l) => l.id === loanId);
    if (!loan) return;
    const ym =
      ($('.page.active')?.id === 'page-loandetail'
        ? today().slice(0, 7)
        : $('#financeMonth')?.value) || today().slice(0, 7);
    if (loanPaymentFor(loanId, ym)) {
      toast('Already paid for ' + monthLabel(ym));
      return;
    }
    const dueDay = Math.min(Number(loan.dueDay) || 1, daysInMonth(ym));
    const defaultDate = `${ym}-${String(dueDay).padStart(2, '0')}`;
    openModal(
      'Mark EMI paid — ' + loan.vehicleNo,
      `<div class="form-grid cols-2">
        <label class="field"><span>Payment date</span><input type="date" id="lpDate" value="${defaultDate}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="lpAmt" min="0" value="${loan.emiAmount || 0}" /></label>
        <p style="grid-column:1/-1;margin:0;color:var(--muted);font-size:.85rem">Posts Debit · Finance / EMI to Purchase &amp; Expense for <strong style="color:var(--text)">${activeQuarry().name}</strong> · ${monthLabel(ym)}</p>
      </div>`,
      () => {
        const amt = Number($('#lpAmt').value) || 0;
        if (amt <= 0) {
          toast('Amount required');
          return false;
        }
        const date = $('#lpDate').value || today();
        const expenseId = uid();
        const payId = uid();
        const payYm = date.slice(0, 7) || ym;
        state.expenses.push({
          id: expenseId,
          quarryId: state.activeQuarryId,
          date,
          type: 'Debit',
          head: 'Finance / EMI',
          particulars: `EMI — ${loan.vehicleNo} · ${loan.bank} · ${loan.loanNo}`,
          debit: amt,
          credit: 0,
          loanId: loan.id,
          loanPaymentId: payId,
        });
        if (!state.loanPayments) state.loanPayments = [];
        state.loanPayments.push({
          id: payId,
          loanId: loan.id,
          quarryId: state.activeQuarryId,
          ym: payYm,
          date,
          amount: amt,
          expenseId,
        });
        toast('EMI paid · expense posted');
        return true;
      },
      { onAfterSave: () => refreshLoanViews() }
    );
  }

  function undoLoanPaid(loanId, payId) {
    const ym = $('#financeMonth')?.value || today().slice(0, 7);
    const pay =
      (payId && (state.loanPayments || []).find((p) => p.id === payId)) || loanPaymentFor(loanId, ym);
    if (!pay) return;
    if (!confirm('Undo EMI payment' + (pay.ym ? ' for ' + monthLabel(pay.ym) : '') + '?')) return;
    state.loanPayments = (state.loanPayments || []).filter((p) => p.id !== pay.id);
    if (pay.expenseId) state.expenses = state.expenses.filter((e) => e.id !== pay.expenseId);
    save(state);
    toast('Payment undone');
    refreshLoanViews();
  }

  function loanTransactions(loanId) {
    const pays = (state.loanPayments || [])
      .filter((p) => p.loanId === loanId)
      .slice()
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.ym).localeCompare(String(b.ym)));
    let run = 0;
    return pays.map((p) => {
      const debit = Number(p.amount) || 0;
      run += debit;
      const q = state.quarries.find((x) => x.id === p.quarryId);
      return {
        id: p.id,
        type: 'EMI',
        date: p.date || '',
        ym: p.ym || (p.date || '').slice(0, 7),
        particulars: `EMI paid${q ? ' · ' + q.name : ''}`,
        head: 'Finance / EMI',
        debit,
        credit: 0,
        balance: run,
        expenseId: p.expenseId || '',
      };
    });
  }

  function renderLoanDetail() {
    const loan = (state.loans || []).find((l) => l.id === selectedLoanId);
    if (!loan) {
      go('finance');
      return;
    }
    const ym = today().slice(0, 7);
    const st = loanStatus(loan, ym);
    const txnsAll = loanTransactions(loan.id);
    const totalPaid = txnsAll.length ? txnsAll[txnsAll.length - 1].balance : 0;
    const monthsPaid = txnsAll.length;

    if ($('#loanDetailTitle')) $('#loanDetailTitle').textContent = loan.vehicleNo || 'Loan';
    if ($('#loanDetailSub')) {
      $('#loanDetailSub').textContent = `${loan.borrower || '—'} · ${loan.bank || '—'} · ${loan.loanNo || '—'}`;
    }
    if ($('#loanDetailBal')) {
      $('#loanDetailBal').innerHTML = `
        <small>This month</small>
        <strong class="${st.cls === 'ok' ? 'pos' : st.cls === 'danger' ? 'neg' : ''}">${st.label}</strong>`;
    }

    const profileEl = $('#loanDetailProfile');
    if (profileEl) {
      const initials = (loan.vehicleNo || '?')
        .split(/[\s-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
      const row = (label, v, wide) =>
        `<div class="staff-row${wide ? ' wide' : ''}"><dt>${label}</dt><dd${v ? '' : ' class="empty"'}>${v || '—'}</dd></div>`;
      profileEl.innerHTML = `
        <div class="staff-profile">
          <div class="staff-profile-hero">
            <div class="staff-avatar" aria-hidden="true">${initials}</div>
            <div class="staff-profile-hero-main">
              <h3>${loan.vehicleNo}</h3>
              <div class="staff-profile-meta">
                <span class="badge ${loan.active !== false ? 'ok' : 'danger'}">${loan.active !== false ? 'Active' : 'Inactive'}</span>
                <span class="badge ${st.cls}">${st.label}</span>
                <span style="color:var(--muted);font-size:.8rem">${loan.borrower || ''}</span>
              </div>
            </div>
            <div class="staff-profile-pay">
              <small>EMI / month</small>
              <strong>${money(loan.emiAmount)}</strong>
            </div>
          </div>
          <dl class="staff-profile-dl">
            ${row('Vehicle / asset', loan.vehicleNo)}
            ${row('Name', loan.borrower)}
            ${row('Loan number', loan.loanNo)}
            ${row('Bank', loan.bank)}
            ${row('Inform day', String(loan.informDay ?? '—'))}
            ${row('Due day', String(loan.dueDay ?? '—'))}
            ${row('EMI amount', money(loan.emiAmount))}
            ${row('Status', loan.active !== false ? 'Active' : 'Inactive')}
          </dl>
        </div>`;
    }

    if ($('#loanDetailPayBtn')) {
      const paidThis = !!loanPaymentFor(loan.id, ym);
      $('#loanDetailPayBtn').textContent = paidThis ? 'Undo this month' : 'Mark paid';
      $('#loanDetailPayBtn').classList.toggle('btn-primary', !paidThis);
      $('#loanDetailPayBtn').classList.toggle('btn-ghost', paidThis);
      $('#loanDetailPayBtn').onclick = () => {
        if (paidThis) undoLoanPaid(loan.id);
        else markLoanPaid(loan.id);
      };
    }

    if ($('#loanDetailStats')) {
      $('#loanDetailStats').innerHTML = `
        <div class="card"><h3>EMI</h3><div class="stat warn">${money(loan.emiAmount)}</div><div class="hint">Due on ${loan.dueDay} · inform ${loan.informDay}</div></div>
        <div class="card"><h3>Payments</h3><div class="stat">${monthsPaid}</div><div class="hint">Months paid</div></div>
        <div class="card"><h3>Total paid</h3><div class="stat ok">${money(totalPaid)}</div><div class="hint">All EMI history</div></div>
        <div class="card"><h3>${monthLabel(ym)}</h3><div class="stat ${st.cls === 'danger' ? 'danger' : st.cls === 'ok' ? 'ok' : 'warn'}">${st.label}</div><div class="hint">${loanPaymentFor(loan.id, ym) ? 'Paid' : 'Not paid yet'}</div></div>`;
    }

    const tq = ($('#loanTxnSearch')?.value || '').toLowerCase().trim();
    let txns = txnsAll.slice().reverse();
    if (tq) {
      txns = txns.filter((t) =>
        `${t.type} ${t.date} ${t.ym} ${t.particulars} ${t.head}`.toLowerCase().includes(tq)
      );
    }
    if ($('#loanTxnTable')) {
      $('#loanTxnTable').innerHTML = txns.length
        ? txns
            .map(
              (t) => `<tr>
                <td><span class="badge ok">${t.type}</span></td>
                <td>${t.date || '—'}</td>
                <td>${t.ym ? monthLabel(t.ym) : '—'}</td>
                <td>${t.particulars}<div class="s" style="color:var(--muted);font-size:.72rem">${t.head}</div></td>
                <td class="num">${t.debit ? money(t.debit) : '—'}</td>
                <td class="num">${t.credit ? money(t.credit) : '—'}</td>
                <td class="num">${money(t.balance)}</td>
                <td><button type="button" class="btn btn-ghost btn-sm" data-loan-undo-pay="${t.id}">Undo</button></td>
              </tr>`
            )
            .join('')
        : `<tr><td colspan="8"><div class="empty">No EMI payments yet — use Mark paid</div></td></tr>`;
      $$('#loanTxnTable [data-loan-undo-pay]').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          undoLoanPaid(loan.id, b.dataset.loanUndoPay);
        })
      );
    }
  }

  function seedGiftsFallback() {
    return [
      { id: 'gf1', place: 'ILLUPPOR', office: 'THASILTHAR', amount: 20000, dueDay: 7, active: true },
      { id: 'gf2', place: 'ANNAVASAL', office: 'RI & VAO (10+5)', amount: 15000, dueDay: 7, active: true },
      { id: 'gf3', place: 'ANNAVASAL', office: 'POLICE STATION', amount: 17000, dueDay: 7, active: true },
      { id: 'gf4', place: 'ILLUPPOR', office: 'ILLUPPOR', amount: 10000, dueDay: 7, active: true },
      { id: 'gf5', place: 'MELUR', office: 'MELUR (DSP)', amount: 10000, dueDay: 7, active: true },
      { id: 'gf6', place: 'MELUR', office: 'INSPECTER - MELUR (10+3)', amount: 13000, dueDay: 7, active: true },
      { id: 'gf7', place: 'MELUR', office: 'MELUR- THASILTHAR (10+3+2)', amount: 15000, dueDay: 7, active: true },
      { id: 'gf8', place: 'MELUR', office: 'KANNAN ( RI )', amount: 10000, dueDay: 7, active: true },
      { id: 'gf9', place: 'THIRUVATHOOR', office: 'RI', amount: 5000, dueDay: 7, active: true },
      { id: 'gf10', place: 'POOVANTHI', office: 'THASILTHAR -THIRUPPUVANAM (10+2)', amount: 12000, dueDay: 7, active: true },
      { id: 'gf11', place: 'MELUR', office: 'TRAFFIC POLICE', amount: 3000, dueDay: 7, active: true },
    ];
  }

  function ensureGiftMonthOptions() {
    const sel = $('#giftMonth');
    if (!sel) return;
    const opts = recentMonths(18);
    const prev = sel.value;
    if (!sel.dataset.filled) {
      sel.innerHTML = opts.map((v) => `<option value="${v}">${monthLabel(v)}</option>`).join('');
      sel.dataset.filled = '1';
    }
    if (!prev || !opts.includes(prev)) sel.value = opts[0];
    else sel.value = prev;
    if (!sel.dataset.bound) {
      sel.dataset.bound = '1';
      sel.addEventListener('change', renderGifts);
    }
  }

  function giftPaymentFor(giftId, ym) {
    return (state.giftPayments || []).find((p) => p.giftId === giftId && p.ym === ym);
  }

  function giftStatus(gift, ym) {
    if (giftPaymentFor(gift.id, ym)) return { key: 'paid', label: 'Paid', cls: 'ok' };
    const [y, m] = ym.split('-').map(Number);
    const day = Number(gift.dueDay) || 7;
    const dueDate = new Date(y, m - 1, Math.min(day, daysInMonth(ym)));
    const now = new Date();
    const todayD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const viewingCurrent =
      ym === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (viewingCurrent) {
      if (todayD > dueDate) return { key: 'unpaid', label: 'Overdue', cls: 'danger' };
      return { key: 'unpaid', label: 'Due', cls: 'warn' };
    }
    const viewEnd = new Date(y, m, 0);
    if (viewEnd < todayD) return { key: 'unpaid', label: 'Unpaid', cls: 'danger' };
    return { key: 'unpaid', label: 'Upcoming', cls: '' };
  }

  function openGiftForm(existing) {
    const G = existing || {};
    openModal(
      existing ? 'Edit gift' : 'Add gift',
      `<div class="form-grid cols-2">
        <label class="field"><span>Place</span><input id="gfPlace" value="${(G.place || '').replace(/"/g, '&quot;')}" placeholder="MELUR" /></label>
        <label class="field"><span>Office / person</span><input id="gfOffice" value="${(G.office || '').replace(/"/g, '&quot;')}" placeholder="THASILTHAR" /></label>
        <label class="field"><span>Due day</span><input type="number" id="gfDue" min="1" max="31" value="${G.dueDay || 7}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="gfAmt" min="0" value="${G.amount || 0}" /></label>
        <label class="field"><span>Active</span>
          <select id="gfActive"><option value="1" ${G.active !== false ? 'selected' : ''}>Yes</option><option value="0" ${G.active === false ? 'selected' : ''}>No</option></select>
        </label>
      </div>`,
      () => {
        const place = ($('#gfPlace').value || '').trim();
        if (!place) {
          toast('Place required');
          return false;
        }
        const row = {
          id: G.id || uid(),
          place,
          office: ($('#gfOffice').value || '').trim() || '—',
          dueDay: Number($('#gfDue').value) || 7,
          amount: Number($('#gfAmt').value) || 0,
          active: $('#gfActive').value === '1',
        };
        if (!state.gifts) state.gifts = [];
        if (existing) {
          const i = state.gifts.findIndex((x) => x.id === existing.id);
          if (i >= 0) state.gifts[i] = row;
        } else state.gifts.push(row);
        toast(existing ? 'Gift updated' : 'Gift added');
        return true;
      },
      { onAfterSave: () => renderGifts() }
    );
  }

  function markGiftPaid(giftId) {
    const gift = (state.gifts || []).find((g) => g.id === giftId);
    if (!gift) return;
    const ym = $('#giftMonth')?.value || today().slice(0, 7);
    if (giftPaymentFor(giftId, ym)) {
      toast('Already paid for ' + monthLabel(ym));
      return;
    }
    const dueDay = Math.min(Number(gift.dueDay) || 7, daysInMonth(ym));
    const defaultDate = `${ym}-${String(dueDay).padStart(2, '0')}`;
    openModal(
      'Mark gift paid — ' + gift.place,
      `<div class="form-grid cols-2">
        <label class="field"><span>Payment date</span><input type="date" id="gpDate" value="${defaultDate}" /></label>
        <label class="field"><span>Amount</span><input type="number" id="gpAmt" min="0" value="${gift.amount || 0}" /></label>
        <p style="grid-column:1/-1;margin:0;color:var(--muted);font-size:.85rem">${gift.office} · posts Debit · Monthly Gift for <strong style="color:var(--text)">${activeQuarry().name}</strong> · ${monthLabel(ym)}</p>
      </div>`,
      () => {
        const amt = Number($('#gpAmt').value) || 0;
        if (amt <= 0) {
          toast('Amount required');
          return false;
        }
        const date = $('#gpDate').value || today();
        const expenseId = uid();
        const payId = uid();
        state.expenses.push({
          id: expenseId,
          quarryId: state.activeQuarryId,
          date,
          type: 'Debit',
          head: 'Monthly Gift',
          particulars: `Gift — ${gift.place} · ${gift.office}`,
          debit: amt,
          credit: 0,
          giftId: gift.id,
          giftPaymentId: payId,
        });
        if (!state.giftPayments) state.giftPayments = [];
        state.giftPayments.push({
          id: payId,
          giftId: gift.id,
          quarryId: state.activeQuarryId,
          ym,
          date,
          amount: amt,
          expenseId,
        });
        toast('Gift marked paid');
        return true;
      },
      { onAfterSave: () => renderGifts() }
    );
  }

  function undoGiftPaid(giftId) {
    const ym = $('#giftMonth')?.value || today().slice(0, 7);
    const pay = giftPaymentFor(giftId, ym);
    if (!pay) return;
    if (!confirm('Undo gift payment for ' + monthLabel(ym) + '?')) return;
    state.giftPayments = (state.giftPayments || []).filter((p) => p.id !== pay.id);
    if (pay.expenseId) state.expenses = state.expenses.filter((e) => e.id !== pay.expenseId);
    save(state);
    toast('Gift payment undone');
    renderGifts();
  }

  function renderGifts() {
    if (!state.gifts || !state.gifts.length) state.gifts = seedGiftsFallback();
    if (!state.giftPayments) state.giftPayments = [];
    ensureGiftMonthOptions();
    const ym = $('#giftMonth')?.value || today().slice(0, 7);
    const filter = $('#giftFilter')?.value || 'all';
    const q = ($('#giftSearch')?.value || '').toLowerCase().trim();

    let rows = (state.gifts || []).filter((g) => g.active !== false);
    rows = rows.map((g) => ({ ...g, status: giftStatus(g, ym), pay: giftPaymentFor(g.id, ym) }));
    if (filter === 'unpaid') rows = rows.filter((g) => g.status.key === 'unpaid');
    if (filter === 'paid') rows = rows.filter((g) => g.status.key === 'paid');
    if (q) {
      rows = rows.filter((g) => `${g.place} ${g.office}`.toLowerCase().includes(q));
    }

    const allActive = (state.gifts || []).filter((g) => g.active !== false);
    const monthly = allActive.reduce((s, g) => s + (Number(g.amount) || 0), 0);
    const paidAmt = allActive
      .map((g) => giftPaymentFor(g.id, ym))
      .filter(Boolean)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const unpaidN = allActive.filter((g) => giftStatus(g, ym).key === 'unpaid').length;

    if ($('#giftStats')) {
      $('#giftStats').innerHTML = `
        <div class="card"><h3>Gift lines</h3><div class="stat">${allActive.length}</div><div class="hint">Due day 7</div></div>
        <div class="card"><h3>Monthly total</h3><div class="stat warn">${money(monthly)}</div><div class="hint">All places</div></div>
        <div class="card"><h3>Paid · ${monthLabel(ym)}</h3><div class="stat ok">${money(paidAmt)}</div><div class="hint">${allActive.filter((g) => giftPaymentFor(g.id, ym)).length} of ${allActive.length}</div></div>
        <div class="card"><h3>Unpaid</h3><div class="stat ${unpaidN ? 'danger' : 'ok'}">${unpaidN || '—'}</div><div class="hint">${monthLabel(ym)}</div></div>`;
    }

    if ($('#giftTable')) {
      $('#giftTable').innerHTML = rows.length
        ? rows
            .map((g, i) => {
              const paid = !!g.pay;
              return `<tr>
                <td class="num">${i + 1}</td>
                <td><strong>${g.place}</strong></td>
                <td>${g.office || '—'}</td>
                <td class="num">${g.dueDay || 7}</td>
                <td class="num">${money(g.amount)}</td>
                <td><span class="badge ${g.status.cls}">${g.status.label}</span>${
                  paid && g.pay?.date
                    ? `<div class="s" style="color:var(--muted);font-size:.72rem">${g.pay.date}</div>`
                    : ''
                }</td>
                <td style="white-space:nowrap">
                  ${
                    paid
                      ? `<button type="button" class="btn btn-ghost btn-sm" data-gift-undo="${g.id}">Undo</button>`
                      : `<button type="button" class="btn btn-primary btn-sm" data-gift-pay="${g.id}">Mark paid</button>`
                  }
                  <button type="button" class="btn btn-ghost btn-sm" data-gift-edit="${g.id}">Edit</button>
                </td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="7"><div class="empty">No gift lines match this filter</div></td></tr>`;
      $$('#giftTable [data-gift-pay]').forEach((b) =>
        b.addEventListener('click', () => markGiftPaid(b.dataset.giftPay))
      );
      $$('#giftTable [data-gift-undo]').forEach((b) =>
        b.addEventListener('click', () => undoGiftPaid(b.dataset.giftUndo))
      );
      $$('#giftTable [data-gift-edit]').forEach((b) =>
        b.addEventListener('click', () => {
          const gift = (state.gifts || []).find((g) => g.id === b.dataset.giftEdit);
          if (gift) openGiftForm(gift);
        })
      );
    }
  }

  function renderFinanceLoans() {
    if (!state.loans || !state.loans.length) state.loans = seedLoansFallback();
    if (!state.loanPayments) state.loanPayments = [];
    ensureFinanceMonthOptions();
    const ym = $('#financeMonth')?.value || today().slice(0, 7);
    const filter = $('#financeFilter')?.value || 'all';
    const q = ($('#financeSearch')?.value || '').toLowerCase().trim();

    let rows = (state.loans || []).filter((l) => l.active !== false);
    rows = rows.map((l) => ({ ...l, status: loanStatus(l, ym), pay: loanPaymentFor(l.id, ym) }));
    if (filter === 'due') rows = rows.filter((l) => l.status.key === 'due' || l.status.key === 'overdue');
    if (filter === 'overdue') rows = rows.filter((l) => l.status.key === 'overdue');
    if (filter === 'paid') rows = rows.filter((l) => l.status.key === 'paid');
    if (q) {
      rows = rows.filter((l) =>
        `${l.vehicleNo} ${l.borrower} ${l.loanNo} ${l.bank}`.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => Number(a.dueDay) - Number(b.dueDay) || a.vehicleNo.localeCompare(b.vehicleNo));

    const allActive = (state.loans || []).filter((l) => l.active !== false);
    const monthly = allActive.reduce((s, l) => s + (Number(l.emiAmount) || 0), 0);
    const paidAmt = allActive
      .map((l) => loanPaymentFor(l.id, ym))
      .filter(Boolean)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const overdueN = allActive.filter((l) => loanStatus(l, ym).key === 'overdue').length;
    const dueN = allActive.filter((l) => {
      const k = loanStatus(l, ym).key;
      return k === 'due' || k === 'overdue';
    }).length;

    $('#financeStats').innerHTML = `
      <div class="card"><h3>Active loans</h3><div class="stat">${allActive.length}</div><div class="hint">Company EMI board</div></div>
      <div class="card"><h3>Monthly EMI</h3><div class="stat warn">${money(monthly)}</div><div class="hint">All dues total</div></div>
      <div class="card"><h3>Paid · ${monthLabel(ym)}</h3><div class="stat ok">${money(paidAmt)}</div><div class="hint">${allActive.filter((l) => loanPaymentFor(l.id, ym)).length} of ${allActive.length}</div></div>
      <div class="card"><h3>Attention</h3><div class="stat ${overdueN ? 'danger' : dueN ? 'warn' : 'ok'}">${dueN || '—'}</div><div class="hint">${overdueN ? overdueN + ' overdue' : 'Due / soon this month'}</div></div>`;

    $('#financeTable').innerHTML = rows.length
      ? rows
          .map((l, i) => {
            const paid = !!l.pay;
            return `<tr data-loan-row="${l.id}" style="cursor:pointer">
              <td class="num">${i + 1}</td>
              <td><strong>${l.vehicleNo}</strong></td>
              <td>${l.borrower || '—'}</td>
              <td style="font-family:var(--num);font-size:.82rem">${l.loanNo || '—'}</td>
              <td class="num">${l.informDay}</td>
              <td class="num">${l.dueDay}</td>
              <td>${l.bank || '—'}</td>
              <td class="num">${money(l.emiAmount)}</td>
              <td><span class="badge ${l.status.cls}">${l.status.label}</span>${
                paid && l.pay?.date
                  ? `<div class="s" style="color:var(--muted);font-size:.72rem">${l.pay.date}</div>`
                  : ''
              }</td>
              <td style="white-space:nowrap" data-loan-actions>
                ${
                  paid
                    ? `<button type="button" class="btn btn-ghost btn-sm" data-loan-undo="${l.id}">Undo</button>`
                    : `<button type="button" class="btn btn-primary btn-sm" data-loan-pay="${l.id}">Mark paid</button>`
                }
                <button type="button" class="btn btn-ghost btn-sm" data-loan-edit="${l.id}">Edit</button>
              </td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="10"><div class="empty">No loans match this filter</div></td></tr>`;

    $$('#financeTable [data-loan-row]').forEach((tr) =>
      tr.addEventListener('click', (e) => {
        if (e.target.closest('[data-loan-actions]')) return;
        go('loan', { loanId: tr.dataset.loanRow });
      })
    );
    $$('#financeTable [data-loan-pay]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        markLoanPaid(b.dataset.loanPay);
      })
    );
    $$('#financeTable [data-loan-undo]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        undoLoanPaid(b.dataset.loanUndo);
      })
    );
    $$('#financeTable [data-loan-edit]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const loan = (state.loans || []).find((l) => l.id === b.dataset.loanEdit);
        if (loan) openLoanForm(loan);
      })
    );
  }

  function renderFinance() {
    renderFinanceLoans();
  }

  $('#addLoanBtn')?.addEventListener('click', () => openLoanForm(null));
  $('#addGiftBtn')?.addEventListener('click', () => openGiftForm(null));
  $('#financeFilter')?.addEventListener('change', renderFinance);
  $('#financeSearch')?.addEventListener('input', renderFinance);
  $('#giftFilter')?.addEventListener('change', renderGifts);
  $('#giftSearch')?.addEventListener('input', renderGifts);
  $('#loanTxnSearch')?.addEventListener('input', renderLoanDetail);
  $('#loanDetailBack')?.addEventListener('click', () => go('finance'));
  $('#loanDetailEditBtn')?.addEventListener('click', () => {
    const loan = (state.loans || []).find((l) => l.id === selectedLoanId);
    if (loan) openLoanForm(loan);
  });
  $('#loanDetailExcel')?.addEventListener('click', () => {
    const loan = (state.loans || []).find((l) => l.id === selectedLoanId);
    if (!loan) return;
    const rows = loanTransactions(loan.id);
    downloadCsv(
      `loan-${(loan.vehicleNo || loan.id).replace(/\s+/g, '-')}.csv`,
      [
        ['Type', 'Date', 'Month', 'Comment', 'Debit', 'Credit', 'Total paid'],
        ...rows.map((t) => [t.type, t.date, t.ym, t.particulars, t.debit, t.credit, t.balance]),
      ]
    );
    toast('Loan statement exported');
  });
  $('#exportFinanceBtn')?.addEventListener('click', () => {
    const ym = $('#financeMonth')?.value || today().slice(0, 7);
    const rows = (state.loans || []).filter((l) => l.active !== false);
    downloadCsv(`finance-emi-${ym}.csv`, [
      ['S.No', 'Vehicle', 'Name', 'Loan number', 'Inform', 'Due date', 'Bank', 'Due amount', 'Status', 'Paid date'],
      ...rows.map((l, i) => {
        const st = loanStatus(l, ym);
        const pay = loanPaymentFor(l.id, ym);
        return [i + 1, l.vehicleNo, l.borrower, l.loanNo, l.informDay, l.dueDay, l.bank, l.emiAmount, st.label, pay?.date || ''];
      }),
    ]);
    toast('Finance exported');
  });
  $('#exportGiftBtn')?.addEventListener('click', () => {
    const ym = $('#giftMonth')?.value || today().slice(0, 7);
    const rows = (state.gifts || []).filter((g) => g.active !== false);
    downloadCsv(`monthly-gift-${ym}.csv`, [
      ['S.No', 'Place', 'Office', 'Due day', 'Amount', 'Status', 'Paid date'],
      ...rows.map((g, i) => {
        const st = giftStatus(g, ym);
        const pay = giftPaymentFor(g.id, ym);
        return [i + 1, g.place, g.office, g.dueDay, g.amount, st.label, pay?.date || ''];
      }),
    ]);
    toast('Gift list exported');
  });

  function renderRoyalty() {
    const marks = quarryMarkings();
    const rows = marks.map((m) => {
      const p = state.parties.find((x) => x.id === m.partyId);
      const v = volCBM(m);
      const rate = quarryRates().royaltyRate;
      return { date: m.date, particulars: `${p?.name || ''} — ${m.blockNo}`, cbm: v, rate, amount: v * rate };
    });
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const totalC = rows.reduce((s, r) => s + r.cbm, 0);
    $('#royaltyStats').innerHTML = `
      <div class="card"><h3>CBM</h3><div class="stat">${cbm(totalC)}</div></div>
      <div class="card"><h3>Rate</h3><div class="stat">${money(quarryRates().royaltyRate)}</div></div>
      <div class="card"><h3>Royalty due</h3><div class="stat warn">${money(total)}</div></div>
      <div class="card"><h3>Entries</h3><div class="stat">${rows.length}</div></div>`;
    $('#royaltyTable').innerHTML = rows.length
      ? rows
          .map(
            (r) => `<tr><td>${r.date}</td><td>${r.particulars}</td><td class="num">${cbm(r.cbm)}</td>
        <td class="num">${money(r.rate)}</td><td class="num">${money(r.amount)}</td></tr>`
          )
          .join('')
      : `<tr><td colspan="5"><div class="empty">No royalty for ${contextLabel()}</div></td></tr>`;
  }

  function readingMonth(r) {
    if (r?.date) return String(r.date).slice(0, 7);
    return r?.month || '';
  }

  function readingSortKey(r) {
    return readingMonth(r) + '|' + (r.date || '') + '|' + (machineById(r.machineId)?.name || '');
  }

  function readingInRange(r, from, to) {
    const ym = readingMonth(r);
    const d = r.date || (ym ? `${ym}-01` : '');
    if (!d) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  }

  function syncMachFilterUi() {
    const mode = $('#machViewMode')?.value || 'month';
    const monthEl = $('#machMonth');
    const rangeWrap = $('#machRangeWrap');
    if (monthEl) monthEl.style.display = mode === 'month' ? '' : 'none';
    if (rangeWrap) rangeWrap.style.display = mode === 'range' ? 'inline-flex' : 'none';
    if (mode === 'range') {
      if ($('#machFrom') && !$('#machFrom').value) {
        const ym = today().slice(0, 7);
        $('#machFrom').value = ym + '-01';
      }
      if ($('#machTo') && !$('#machTo').value) $('#machTo').value = today();
    }
  }

  function ensureMachMonthOptions() {
    const sel = $('#machMonth');
    if (!sel) return;
    const set = new Set(quarryMachineReadings().map((r) => readingMonth(r)).filter(Boolean));
    set.add(today().slice(0, 7));
    recentMonths(12).forEach((m) => set.add(m));
    const opts = [...set].sort().reverse();
    const cur = sel.value;
    sel.innerHTML = opts.map((v) => `<option value="${v}">${monthLabel(v)}</option>`).join('');
    if (opts.includes(cur)) sel.value = cur;
    else sel.value = opts[0];
    if (!sel.dataset.bound) {
      sel.dataset.bound = '1';
      sel.addEventListener('change', () => renderMachinery());
    }
    if ($('#machViewMode') && !$('#machViewMode').dataset.bound) {
      $('#machViewMode').dataset.bound = '1';
      $('#machViewMode').addEventListener('change', () => {
        syncMachFilterUi();
        renderMachinery();
      });
    }
    ['machFrom', 'machTo'].forEach((id) => {
      const el = $('#' + id);
      if (el && !el.dataset.bound) {
        el.dataset.bound = '1';
        el.addEventListener('change', () => renderMachinery());
      }
    });
    syncMachFilterUi();
  }

  function filteredMachineReadings() {
    const mode = $('#machViewMode')?.value || 'month';
    let rows = quarryMachineReadings();
    if (mode === 'month') {
      const month = $('#machMonth')?.value || today().slice(0, 7);
      rows = rows.filter((r) => readingMonth(r) === month);
    } else if (mode === 'range') {
      const from = $('#machFrom')?.value || '';
      const to = $('#machTo')?.value || '';
      rows = rows.filter((r) => readingInRange(r, from, to));
    }
    return rows.sort((a, b) => readingSortKey(b).localeCompare(readingSortKey(a)));
  }

  function machineById(id) {
    return (state.machines || []).find((m) => m.id === id);
  }

  function postRentFromReading(reading) {
    // Keep a single helper path: full sync from all readings → vendor Credit
    syncMachineLedgerFromReadings(state);
  }

  function ensureVendorRentCredits() {
    const before = JSON.stringify(state.machineLedger || []);
    syncMachineLedgerFromReadings(state);
    if (JSON.stringify(state.machineLedger || []) !== before) save(state);
  }

  function parseMeter(val) {
    const t = String(val || '').trim();
    if (!t) return '';
    if (/^full$/i.test(t)) return 'Full';
    const n = Number(t);
    return Number.isFinite(n) ? n : t;
  }

  function calcHoursFromMeters(start, close) {
    if (start === 'Full' || close === 'Full') return null;
    const a = Number(start);
    const b = Number(close);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return Math.round((b - a) * 10) / 10;
  }

  function renderMachinery() {
    ensureMachMonthOptions();
    const mode = $('#machViewMode')?.value || 'month';
    const month = $('#machMonth')?.value || today().slice(0, 7);
    const readings = filteredMachineReadings();
    const showMonthCol = mode !== 'month';
    const rangeHint =
      mode === 'all'
        ? 'All readings'
        : mode === 'range'
          ? `${$('#machFrom')?.value || '…'} → ${$('#machTo')?.value || '…'}`
          : monthLabel(month);

    if ($('#machReadingHead')) {
      $('#machReadingHead').innerHTML = showMonthCol
        ? `<th>Month</th><th>Machine</th><th>Type</th><th>Vendor</th>
           <th class="num">Start</th><th class="num">Close</th><th class="num">Hours</th>
           <th class="num">Days</th><th class="num">Diesel</th><th class="num">L/Hr</th>
           <th class="num">Rent</th>`
        : `<th>Machine</th><th>Type</th><th>Vendor</th>
           <th class="num">Start</th><th class="num">Close</th><th class="num">Hours</th>
           <th class="num">Days</th><th class="num">Diesel</th><th class="num">L/Hr</th>
           <th class="num">Rent</th>`;
    }

    const totRent = readings.reduce((s, r) => s + Number(r.rent || 0), 0);
    const totDiesel = readings.reduce((s, r) => s + Number(r.diesel || 0), 0);
    const totDays = readings.reduce((s, r) => s + Number(r.days || 0), 0);
    $('#machReadingStats').innerHTML = `
      <div class="card"><h3>Readings</h3><div class="stat">${readings.length}</div><div class="hint">${rangeHint}</div></div>
      <div class="card"><h3>Days (sum)</h3><div class="stat">${totDays}</div></div>
      <div class="card"><h3>Diesel (info)</h3><div class="stat">${totDiesel || '—'}</div><div class="hint">litres</div></div>
      <div class="card"><h3>Rent total</h3><div class="stat warn">${money(totRent)}</div></div>`;

    const colSpan = showMonthCol ? 11 : 10;
    $('#machReadingTable').innerHTML = readings.length
      ? readings
          .map((r) => {
            const mac = machineById(r.machineId);
            const vend = state.parties.find((p) => p.id === r.vendorId);
            const hrs = readingHoursLabel(r);
            const lph =
              r.litPerHour != null && Number(r.litPerHour)
                ? Number(r.litPerHour).toFixed(2)
                : hrs !== 'Full' && Number(r.hours) > 0 && Number(r.diesel)
                  ? (Number(r.diesel) / Number(r.hours)).toFixed(2)
                  : '—';
            const monthCell = showMonthCol
              ? `<td>${monthLabel(readingMonth(r))}${r.date ? `<div class="s" style="color:var(--muted);font-size:.72rem">${r.date}</div>` : ''}</td>`
              : '';
            return `<tr>
              ${monthCell}
              <td>${mac?.name || '—'}</td>
              <td>${mac?.type || '—'}</td>
              <td>${vend?.name || '—'}</td>
              <td class="num">${readingMeterLabel(r.startReading)}</td>
              <td class="num">${readingMeterLabel(r.closeReading)}</td>
              <td class="num">${hrs}</td>
              <td class="num">${r.days ?? '—'}</td>
              <td class="num">${r.diesel ?? '—'}</td>
              <td class="num">${lph}</td>
              <td class="num">${money(r.rent)}</td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="${colSpan}"><div class="empty">No readings for ${rangeHint} · ${contextLabel()}</div></td></tr>`;

    const masters = quarryMachines().sort((a, b) => a.name.localeCompare(b.name));
    $('#machMasterTable').innerHTML = masters.length
      ? masters
          .map((m) => {
            const vend = state.parties.find((p) => p.id === m.vendorId);
            return `<tr>
              <td>${m.name}</td>
              <td>${m.type || '—'}</td>
              <td>${vend?.name || '—'}</td>
              <td class="num">${money(m.monthlyRent)}</td>
              <td><span class="badge ${m.active !== false ? 'ok' : 'danger'}">${m.active !== false ? 'Active' : 'Off'}</span></td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="5"><div class="empty">No machines — add one first</div></td></tr>`;

    ensureVendorRentCredits();
  }

  $$('#machTabs .tab').forEach((t) =>
    t.addEventListener('click', () => {
      $$('#machTabs .tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      $$('.mach-tab').forEach((p) => (p.style.display = 'none'));
      const pane = $('#mach-' + t.dataset.mt);
      if (pane) pane.style.display = 'block';
    })
  );

  function openAddMachine() {
    openModal(
      'Add machine — ' + contextLabel(),
      `<div class="form-grid cols-2">
        <label class="field" style="grid-column:1/-1"><span>Machine name</span><input id="mcName" placeholder="HM Crane" /></label>
        <label class="field"><span>Type</span><select id="mcType">${machineTypeOptionsHtml('Crane')}</select></label>
        <label class="field"><span>Vendor</span><select id="mcVendor">${vendorOptionsHtml('', true)}</select></label>
        <label class="field"><span>Default monthly rent</span><input type="number" id="mcRent" value="0" min="0" /></label>
        <label class="field"><span>Status</span>
          <select id="mcActive"><option value="1">Active</option><option value="0">Off</option></select>
        </label>
      </div>`,
      () => {
        const name = $('#mcName').value.trim();
        if (!name) {
          toast('Name required');
          return false;
        }
        let type = $('#mcType').value;
        if (type === '__new__') {
          const custom = prompt('New machine type');
          if (!custom || !custom.trim()) {
            toast('Type required');
            return false;
          }
          type = custom.trim();
          if (!state.machineTypes) state.machineTypes = [...DEFAULT_MACHINE_TYPES];
          if (!state.machineTypes.includes(type)) state.machineTypes.push(type);
        }
        let vendorId = $('#mcVendor').value;
        if (vendorId === '__new__') {
          const vname = prompt('Vendor name');
          if (!vname || !vname.trim()) {
            toast('Vendor required');
            return false;
          }
          vendorId = uid();
          state.parties.push({ id: vendorId, name: vname.trim(), type: 'Vendor', gstin: '—' });
        }
        if (!vendorId) {
          toast('Select vendor');
          return false;
        }
        state.machines.push({
          id: uid(),
          quarryId: state.activeQuarryId,
          name,
          type,
          vendorId,
          monthlyRent: Number($('#mcRent').value) || 0,
          active: $('#mcActive').value === '1',
        });
        toast('Machine added');
        return true;
      }
    );
  }

  function openAddMachineReading() {
    const macs = quarryMachines()
      .filter((m) => m.active !== false)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!macs.length) {
      toast('Add a machine first');
      return;
    }
    const month = $('#machMonth')?.value || today().slice(0, 7);
    const dim = daysInMonth(month);
    const vendors = state.parties
      .filter((p) => p.type === 'Vendor' || p.type === 'Both')
      .sort((a, b) => a.name.localeCompare(b.name));
    const vendorOpts = (selectedId) =>
      `<option value="">—</option>` +
      vendors.map((p) => `<option value="${p.id}"${p.id === selectedId ? ' selected' : ''}>${p.name}</option>`).join('');
    const machineOpts = (selectedId) =>
      macs
        .map(
          (m) =>
            `<option value="${m.id}" data-rent="${m.monthlyRent || 0}" data-vendor="${m.vendorId || ''}"${
              m.id === selectedId ? ' selected' : ''
            }>${m.name} · ${m.type || ''}</option>`
        )
        .join('');

    const existing = quarryMachineReadings().filter((r) => readingMonth(r) === month);
    const seedMacs =
      existing.length > 0
        ? existing.map((r) => machineById(r.machineId) || macs[0])
        : [macs[0], macs[1] || macs[0], macs[2] || macs[0]].filter(
            (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i
          );

    const lineRow = (mac, prev) => {
      const m = mac || macs[0];
      const r = prev || {};
      const start = r.startReading != null && r.startReading !== '' ? r.startReading : 'Full';
      const close = r.closeReading != null && r.closeReading !== '' ? r.closeReading : 'Full';
      const hours = r.hours != null ? r.hours : '';
      const days = r.days != null ? r.days : dim;
      const diesel = r.diesel != null ? r.diesel : '';
      const rent = r.rent != null ? r.rent : m.monthlyRent || 0;
      const vendorId = r.vendorId || m.vendorId || '';
      return `<tr class="mr-line" data-base-rent="${m.monthlyRent || 0}">
        <td><select class="mr-machine">${machineOpts(m.id)}</select></td>
        <td><select class="mr-vendor">${vendorOpts(vendorId)}</select></td>
        <td><input class="mr-start" value="${start}" placeholder="Full" /></td>
        <td><input class="mr-close" value="${close}" placeholder="Full" /></td>
        <td><input type="number" class="mr-hours" step="0.1" value="${hours}" placeholder="—" /></td>
        <td><input type="number" class="mr-days" min="0" max="31" value="${days}" /></td>
        <td><input type="number" class="mr-diesel" min="0" step="0.01" value="${diesel}" placeholder="0" /></td>
        <td><input type="number" class="mr-rent" min="0" value="${rent}" /></td>
        <td class="mr-actions">
          <button type="button" class="btn btn-ghost btn-sm mr-full" title="Full rent">Full</button>
          <button type="button" class="btn btn-ghost btn-sm mr-pr" title="Pro-rata">½</button>
          <button type="button" class="btn btn-ghost btn-sm mr-rm" title="Delete row">✕</button>
        </td>
      </tr>`;
    };

    const startRows = seedMacs
      .map((m) => {
        const prev = existing.find((r) => r.machineId === m.id);
        return lineRow(m, prev);
      })
      .join('');

    openModal(
      'Add reading — ' + contextLabel(),
      `<div class="marking-batch mach-reading-batch">
        <div class="form-grid cols-2" style="max-width:420px">
          <label class="field"><span>Month</span><input type="month" id="mrMonth" value="${month}" /></label>
        </div>
        <p style="color:var(--muted);font-size:.85rem;margin:10px 0 8px">Monthly reading — one row per machine. Use <strong>+ Add row</strong> / ✕. Rent posts as vendor Credit.</p>
        <div class="table-wrap marking-lines-wrap">
          <table class="marking-lines mach-reading-lines">
            <thead>
              <tr>
                <th>Machine</th><th>Vendor</th>
                <th>Start</th><th>Close</th><th class="num">Hours</th>
                <th class="num">Days</th><th class="num">Diesel</th><th class="num">Rent</th><th></th>
              </tr>
            </thead>
            <tbody id="mrLinesBody">${startRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="5"><strong>Total rent</strong></td>
                <td></td><td></td>
                <td class="num" id="mrSumRent">—</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-ghost btn-sm" id="mrAddLine">+ Add row</button>
          <button type="button" class="btn btn-ghost btn-sm" id="mrAllFull">All → full rent</button>
          <button type="button" class="btn btn-ghost btn-sm" id="mrAllProRata">All → pro-rata by days</button>
        </div>
      </div>`,
      () => {
        const ym = $('#mrMonth').value;
        if (!ym) {
          toast('Month required');
          return false;
        }
        const monthEnd = `${ym}-${String(daysInMonth(ym)).padStart(2, '0')}`;
        const saved = [];
        const usedMachines = new Set();
        let dup = false;
        $$('#mrLinesBody tr.mr-line').forEach((tr) => {
          if (dup) return;
          const machineId = tr.querySelector('.mr-machine')?.value;
          const vendorId = tr.querySelector('.mr-vendor')?.value;
          if (!machineId || !vendorId) return;
          if (usedMachines.has(machineId)) {
            toast('Duplicate machine in rows — keep one line each');
            dup = true;
            return;
          }
          usedMachines.add(machineId);
          const startReading = parseMeter(tr.querySelector('.mr-start')?.value);
          const closeReading = parseMeter(tr.querySelector('.mr-close')?.value);
          let hours =
            tr.querySelector('.mr-hours')?.value === ''
              ? calcHoursFromMeters(startReading, closeReading)
              : Number(tr.querySelector('.mr-hours')?.value);
          if (startReading === 'Full' || closeReading === 'Full') hours = null;
          const diesel = Number(tr.querySelector('.mr-diesel')?.value) || 0;
          const days = Number(tr.querySelector('.mr-days')?.value) || 0;
          const rent = Number(tr.querySelector('.mr-rent')?.value) || 0;
          const litPerHour = hours && diesel ? Math.round((diesel / hours) * 100) / 100 : 0;

          const old = (state.machineReadings || []).find(
            (r) =>
              r.quarryId === state.activeQuarryId &&
              r.machineId === machineId &&
              readingMonth(r) === ym
          );
          if (old) {
            state.machineReadings = state.machineReadings.filter((r) => r.id !== old.id);
          }

          const reading = {
            id: uid(),
            quarryId: state.activeQuarryId,
            machineId,
            vendorId,
            date: monthEnd,
            month: ym,
            startReading,
            closeReading,
            hours,
            days,
            diesel,
            litPerHour,
            rent,
          };
          state.machineReadings.push(reading);
          const mac = machineById(machineId);
          if (mac) mac.vendorId = vendorId;
          saved.push(reading);
        });
        if (dup) return false;
        if (!saved.length) {
          toast('Add at least one row with machine + vendor');
          return false;
        }
        syncMachineLedgerFromReadings(state);
        const credited = saved.filter((r) => Number(r.rent) > 0).length;
        if ($('#machMonth')) $('#machMonth').value = ym;
        toast(
          `${saved.length} reading${saved.length === 1 ? '' : 's'} · ${monthLabel(ym)}` +
            (credited ? ` · ${credited} rent Credit on vendor` : '')
        );
        return true;
      },
      { xlarge: true }
    );

    const recalcLineHours = (tr) => {
      const start = parseMeter(tr.querySelector('.mr-start')?.value);
      const close = parseMeter(tr.querySelector('.mr-close')?.value);
      const h = calcHoursFromMeters(start, close);
      const hoursEl = tr.querySelector('.mr-hours');
      if (!hoursEl) return;
      if (h != null) hoursEl.value = h;
      else if (start === 'Full' || close === 'Full') hoursEl.value = '';
    };
    const recalcSum = () => {
      let total = 0;
      $$('#mrLinesBody tr.mr-line').forEach((tr) => {
        if (!tr.querySelector('.mr-vendor')?.value) return;
        total += Number(tr.querySelector('.mr-rent')?.value) || 0;
      });
      if ($('#mrSumRent')) $('#mrSumRent').textContent = total ? money(total) : '—';
    };
    const syncMachine = (tr) => {
      const sel = tr.querySelector('.mr-machine');
      const opt = sel?.selectedOptions?.[0];
      if (!opt) return;
      tr.dataset.baseRent = opt.dataset.rent || '0';
      const vend = opt.dataset.vendor;
      const vSel = tr.querySelector('.mr-vendor');
      if (vend && vSel && [...vSel.options].some((o) => o.value === vend)) vSel.value = vend;
      tr.querySelector('.mr-rent').value = Number(opt.dataset.rent) || 0;
      recalcSum();
    };
    const wireLine = (tr) => {
      tr.querySelector('.mr-machine')?.addEventListener('change', () => syncMachine(tr));
      tr.querySelector('.mr-start')?.addEventListener('change', () => recalcLineHours(tr));
      tr.querySelector('.mr-close')?.addEventListener('change', () => recalcLineHours(tr));
      tr.querySelectorAll('input, select').forEach((el) => el.addEventListener('input', recalcSum));
      tr.querySelectorAll('input, select').forEach((el) => el.addEventListener('change', recalcSum));
      tr.querySelector('.mr-full')?.addEventListener('click', () => {
        tr.querySelector('.mr-rent').value = Number(tr.dataset.baseRent) || 0;
        recalcSum();
      });
      tr.querySelector('.mr-pr')?.addEventListener('click', () => {
        const ym = $('#mrMonth')?.value || month;
        tr.querySelector('.mr-rent').value = suggestProRataRent(
          tr.dataset.baseRent,
          tr.querySelector('.mr-days')?.value,
          ym
        );
        recalcSum();
      });
      tr.querySelector('.mr-rm')?.addEventListener('click', () => {
        if ($$('#mrLinesBody tr.mr-line').length <= 1) {
          toast('Keep at least one row');
          return;
        }
        tr.remove();
        recalcSum();
      });
    };
    $$('#mrLinesBody tr.mr-line').forEach(wireLine);
    recalcSum();

    $('#mrAddLine')?.addEventListener('click', () => {
      const unused = macs.find((m) => !$$('#mrLinesBody .mr-machine').some((s) => s.value === m.id)) || macs[0];
      $('#mrLinesBody').insertAdjacentHTML('beforeend', lineRow(unused, null));
      const tr = $('#mrLinesBody').lastElementChild;
      wireLine(tr);
      tr.querySelector('.mr-machine')?.focus();
      recalcSum();
    });
    $('#mrMonth')?.addEventListener('change', () => {
      const ym = $('#mrMonth').value;
      const d = daysInMonth(ym);
      $$('#mrLinesBody .mr-days').forEach((inp) => {
        if (!inp.value || Number(inp.value) === dim) inp.value = d;
      });
    });
    $('#mrAllFull')?.addEventListener('click', () => {
      $$('#mrLinesBody tr.mr-line').forEach((tr) => {
        tr.querySelector('.mr-rent').value = Number(tr.dataset.baseRent) || 0;
      });
      recalcSum();
      toast('Full rent on all rows');
    });
    $('#mrAllProRata')?.addEventListener('click', () => {
      const ym = $('#mrMonth')?.value || month;
      $$('#mrLinesBody tr.mr-line').forEach((tr) => {
        tr.querySelector('.mr-rent').value = suggestProRataRent(
          tr.dataset.baseRent,
          tr.querySelector('.mr-days')?.value,
          ym
        );
      });
      recalcSum();
      toast('Pro-rata on all rows');
    });
  }

  $('#addMachineBtn')?.addEventListener('click', openAddMachine);
  $('#addMachineReadingBtn')?.addEventListener('click', openAddMachineReading);

  function renderMasters() {
    const qn = activeQuarry()?.name || '—';
    if ($('#mastersPill')) $('#mastersPill').textContent = qn;

    const co = companyOf();
    const lockCo = !isOwner();
    const setVal = (id, v) => {
      const el = $('#' + id);
      if (!el) return;
      el.value = v ?? '';
      if (['coName', 'coGstin', 'coIe', 'coState', 'coAddr', 'coPhone', 'coEmail'].includes(id)) {
        el.disabled = lockCo;
      }
    };
    const stSel = $('#coState');
    if (stSel && !stSel.dataset.filled) {
      stSel.innerHTML = INDIA_STATES.map((s) => `<option value="${s}">${s}</option>`).join('');
      stSel.dataset.filled = '1';
    }
    setVal('coName', co.name);
    setVal('coGstin', co.gstin);
    setVal('coIe', co.ieCode);
    setVal('coState', co.state || 'Tamil Nadu');
    setVal('coAddr', co.address);
    setVal('coPhone', co.phone || '');
    setVal('coEmail', co.email || '');

    const banks = companyBanks();
    if ($('#bankTable')) {
      $('#bankTable').innerHTML = banks.length
        ? banks
            .map(
              (b) => `<tr>
                <td><strong>${b.name || '—'}</strong>${b.primary ? ' <span class="bank-primary">primary</span>' : ''}</td>
                <td>${b.branch || '—'}</td>
                <td>${b.acNo || '—'}</td>
                <td>${b.ifsc || '—'}</td>
                <td>${b.holder || '—'}</td>
                <td>
                  <button type="button" class="btn btn-ghost btn-sm need-owner" data-bank-edit="${b.id}">Edit</button>
                  <button type="button" class="btn btn-ghost btn-sm need-owner" data-bank-del="${b.id}">Delete</button>
                </td>
              </tr>`
            )
            .join('')
        : `<tr><td colspan="6"><div class="empty">No bank accounts</div></td></tr>`;
      $$('#bankTable [data-bank-edit]').forEach((btn) =>
        btn.addEventListener('click', () => openBankModal(companyBanks().find((x) => x.id === btn.dataset.bankEdit)))
      );
      $$('#bankTable [data-bank-del]').forEach((btn) =>
        btn.addEventListener('click', () => {
          if (!isOwner()) {
            toast('Owner only');
            return;
          }
          if (!confirm('Remove this bank account?')) return;
          state.banks = companyBanks().filter((x) => x.id !== btn.dataset.bankDel);
          save(state);
          toast('Bank removed');
          renderMasters();
        })
      );
    }

    const allowed = allowedQuarries();
    $('#quarryMasterList').innerHTML = `<div class="list-compact">${allowed
      .map((q) => {
        const r = quarryRates(q.id);
        return `<div class="list-row">
        <div>
          <div class="t">${q.name} ${q.id === state.activeQuarryId ? '· active' : ''}${q.active === false ? ' · inactive' : ''}</div>
          <div class="s">${q.code} · ${q.place} · GST ${r.gstPct}% · Royalty ${money(r.royaltyRate)}/CBM · I ${money(r.cbmRates.I)}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn btn-ghost btn-sm" data-switch="${q.id}">Select</button>
          <button class="btn btn-ghost btn-sm need-owner" data-qedit="${q.id}">Edit</button>
        </div>
      </div>`;
      })
      .join('')}</div>`;
    $$('#quarryMasterList [data-switch]').forEach((b) =>
      b.addEventListener('click', () => {
        if (!allowedQuarries().some((q) => q.id === b.dataset.switch)) {
          toast('No access to that quarry');
          return;
        }
        state.activeQuarryId = b.dataset.switch;
        rememberUserQuarry(state.activeQuarryId);
        save(state);
        toast('Active: ' + activeQuarry().name);
        render();
      })
    );
    $$('#quarryMasterList [data-qedit]').forEach((b) =>
      b.addEventListener('click', () => {
        const q = state.quarries.find((x) => x.id === b.dataset.qedit);
        if (q) openEditQuarry(q);
      })
    );

    fillQuarrySelect($('#rateQuarry'), $('#rateQuarry')?.value || state.activeQuarryId);
    fillQuarrySelect($('#impQuarry'), $('#impQuarry')?.value || state.activeQuarryId);
    fillRateCardForm($('#rateQuarry')?.value || state.activeQuarryId);

    $('#headsList').innerHTML = `<div class="list-compact">${state.heads
      .map((h) => `<div class="list-row"><div class="t">${h}</div><div class="s">Shared</div></div>`)
      .join('')}</div>`;

    if (importRows.length) renderImportPreview();
  }

  function fillQuarrySelect(sel, prefer) {
    if (!sel) return;
    const allowed = allowedQuarries();
    const cur = prefer && allowed.some((q) => q.id === prefer) ? prefer : state.activeQuarryId;
    sel.innerHTML = allowed.map((q) => `<option value="${q.id}">${q.name}</option>`).join('');
    sel.value = allowed.some((q) => q.id === cur) ? cur : allowed[0]?.id || '';
  }

  function fillRateCardForm(qid) {
    const r = quarryRates(qid);
    if ($('#rtGst')) $('#rtGst').value = r.gstPct;
    if ($('#rtRoy')) $('#rtRoy').value = r.royaltyRate;
    if ($('#rtSlab')) $('#rtSlab').value = r.slabRate;
    if ($('#rtCbmI')) $('#rtCbmI').value = r.cbmRates.I;
    if ($('#rtCbmII')) $('#rtCbmII').value = r.cbmRates.II;
    if ($('#rtCbmIII')) $('#rtCbmIII').value = r.cbmRates.III;
    if ($('#rtCbmMix')) $('#rtCbmMix').value = r.cbmRates.Mix;
  }

  function openEditQuarry(q) {
    if (!isOwner()) {
      toast('Owner only');
      return;
    }
    openModal(
      'Edit quarry · ' + q.name,
      `<div class="form-grid">
        <label class="field"><span>Name</span><input id="qName" value="${(q.name || '').replace(/"/g, '&quot;')}" /></label>
        <label class="field"><span>Code</span><input id="qCode" value="${(q.code || '').replace(/"/g, '&quot;')}" /></label>
        <label class="field"><span>Place</span><input id="qPlace" value="${(q.place || '').replace(/"/g, '&quot;')}" /></label>
        <label class="field" style="flex-direction:row;align-items:center;gap:8px">
          <input type="checkbox" id="qActive" ${q.active !== false ? 'checked' : ''} /> Active
        </label>
      </div>`,
      () => {
        if (!$('#qName').value.trim()) {
          toast('Name required');
          return false;
        }
        q.name = $('#qName').value.trim();
        q.code = ($('#qCode').value.trim() || q.name.slice(0, 6)).toUpperCase();
        q.place = $('#qPlace').value.trim() || '—';
        q.active = $('#qActive').checked;
        toast('Quarry updated');
        return true;
      }
    );
  }

  function openBankModal(existing) {
    if (!isOwner()) {
      toast('Owner only');
      return;
    }
    const b = existing || {};
    openModal(
      existing ? 'Edit bank' : 'Add bank',
      `<div class="form-grid cols-2">
        <label class="field"><span>Bank name *</span><input id="bkName" value="${(b.name || '').replace(/"/g, '&quot;')}" placeholder="City Union Bank" /></label>
        <label class="field"><span>Branch</span><input id="bkBranch" value="${(b.branch || '').replace(/"/g, '&quot;')}" placeholder="Melur" /></label>
        <label class="field"><span>A/c no</span><input id="bkAc" value="${(b.acNo || '').replace(/"/g, '&quot;')}" /></label>
        <label class="field"><span>IFSC</span><input id="bkIfsc" value="${(b.ifsc || '').replace(/"/g, '&quot;')}" /></label>
        <label class="field"><span>Account holder</span><input id="bkHolder" value="${(b.holder || companyOf().name || '').replace(/"/g, '&quot;')}" /></label>
        <label class="field" style="flex-direction:row;align-items:center;gap:8px">
          <input type="checkbox" id="bkPrimary" ${b.primary ? 'checked' : ''} /> Primary (salary / PI)
        </label>
      </div>`,
      () => {
        const name = ($('#bkName').value || '').trim();
        if (!name) {
          toast('Bank name required');
          return false;
        }
        if (!Array.isArray(state.banks)) state.banks = [];
        const rec = {
          id: b.id || 'bk_' + uid(),
          name,
          branch: ($('#bkBranch').value || '').trim(),
          acNo: ($('#bkAc').value || '').trim(),
          ifsc: ($('#bkIfsc').value || '').trim().toUpperCase(),
          holder: ($('#bkHolder').value || '').trim() || companyOf().name,
          primary: !!$('#bkPrimary').checked,
        };
        if (rec.primary) state.banks.forEach((x) => (x.primary = false));
        if (existing) {
          const i = state.banks.findIndex((x) => x.id === existing.id);
          if (i >= 0) state.banks[i] = rec;
          else state.banks.push(rec);
        } else state.banks.push(rec);
        toast(existing ? 'Bank updated' : 'Bank added');
        return true;
      }
    );
  }

  $('#addQuarryBtn').addEventListener('click', () => {
    if (!canDeleteMasters()) {
      toast('Only Owner can add quarries');
      return;
    }
    openModal(
      'Add quarry',
      `<div class="form-grid">
        <label class="field"><span>Name</span><input id="qName" placeholder="Kalaiman" /></label>
        <label class="field"><span>Code</span><input id="qCode" placeholder="KALAI" /></label>
        <label class="field"><span>Place</span><input id="qPlace" placeholder="Pudukkottai" /></label>
      </div>`,
      () => {
        if (!$('#qName').value.trim()) {
          toast('Name required');
          return false;
        }
        const id = 'q_' + uid();
        state.quarries.push({
          id,
          name: $('#qName').value.trim(),
          code: ($('#qCode').value.trim() || $('#qName').value.trim().slice(0, 6)).toUpperCase(),
          place: $('#qPlace').value.trim() || '—',
          ...defaultQuarryRates(),
        });
        state.activeQuarryId = id;
        toast('Quarry created & selected (empty books)');
        return true;
      }
    );
  });

  $$('#masterTabs .tab').forEach((t) =>
    t.addEventListener('click', () => {
      $$('#masterTabs .tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      $$('.mtab').forEach((p) => (p.style.display = 'none'));
      const pane = $('#mtab-' + t.dataset.mtab);
      if (pane) pane.style.display = 'block';
    })
  );

  $('#saveCompanyBtn')?.addEventListener('click', () => {
    if (!isOwner()) {
      toast('Owner only');
      return;
    }
    const gstin = ($('#coGstin')?.value || '').trim().toUpperCase().replace(/\s/g, '');
    if (gstin && gstin.length !== 15) {
      toast('GSTIN should be 15 characters');
      return;
    }
    state.company = {
      ...companyOf(),
      name: ($('#coName')?.value || '').trim() || COMPANY.name,
      gstin: gstin || COMPANY.gstin,
      ieCode: ($('#coIe')?.value || '').trim().toUpperCase() || COMPANY.ieCode,
      state: $('#coState')?.value || 'Tamil Nadu',
      address: ($('#coAddr')?.value || '').trim() || COMPANY.address,
      phone: ($('#coPhone')?.value || '').trim(),
      email: ($('#coEmail')?.value || '').trim(),
      banks: bankLine(),
    };
    save(state);
    toast('Company profile saved');
    renderMasters();
  });

  $('#addBankBtn')?.addEventListener('click', () => openBankModal());

  $('#rateQuarry')?.addEventListener('change', () => fillRateCardForm($('#rateQuarry').value));

  $('#saveRatesBtn')?.addEventListener('click', () => {
    if (!canEdit()) {
      toast('No permission to edit');
      return;
    }
    const qid = $('#rateQuarry')?.value || state.activeQuarryId;
    const q = (state.quarries || []).find((x) => x.id === qid);
    if (!q) {
      toast('Select a quarry');
      return;
    }
    q.gstPct = Number($('#rtGst')?.value) || 0;
    q.royaltyRate = Number($('#rtRoy')?.value) || 0;
    q.slabRate = Number($('#rtSlab')?.value) || 0;
    q.cbmRates = {
      I: Number($('#rtCbmI')?.value) || 0,
      II: Number($('#rtCbmII')?.value) || 0,
      III: Number($('#rtCbmIII')?.value) || 0,
      Mix: Number($('#rtCbmMix')?.value) || 0,
    };
    if (qid === state.activeQuarryId) {
      state.gstRate = q.gstPct;
      state.royaltyRate = q.royaltyRate;
    }
    save(state);
    toast('Rate card saved · ' + q.name);
    renderMasters();
  });

  const IMPORT_TEMPLATES = {
    parties: [
      ['Name', 'Type', 'GSTIN', 'Phone', 'State', 'Email', 'Address'],
      ['New Buyer Granites', 'Customer', '33AAAAA0000A1Z5', '9876543210', 'Tamil Nadu', '', 'Melur'],
      ['Local Diesel Vendor', 'Vendor', '', '9876500000', 'Tamil Nadu', '', ''],
    ],
    staff: [
      ['Name', 'Category', 'Designation', 'Basic', 'DailyRate', 'JoinDate', 'Phone', 'Bank', 'Account', 'IFSC'],
      ['Sample Incharge', 'Staff', 'Incharge', '25000', '0', '2026-04-01', '', 'CUB Melur', '', 'CIUB0000123'],
      ['Sample Helper', 'Worker', 'Helper', '0', '700', '2026-06-01', '', '', '', ''],
    ],
    expenses: [
      ['Date', 'Type', 'Category', 'Comment', 'Debit', 'Credit'],
      ['2026-04-01', 'Debit', 'Diesel', 'Opening diesel purchase', '50000', ''],
      ['2026-04-01', 'Credit', 'Cash Received', 'Opening cash', '', '100000'],
    ],
    markings: [
      ['Date', 'Party', 'Block', 'Choice', 'L', 'W', 'H', 'Rate', 'GST', 'Load'],
      ['2026-04-10', 'Platinam Stone', 'PS-201', 'I', '300', '150', '120', '18000', '18', 'OK'],
    ],
    openings: [
      ['Date', 'Party', 'Kind', 'Amount', 'Particulars'],
      ['2026-04-01', 'Bhuvana Explosive', 'Bill', '85000', 'Opening explosive bill'],
      ['2026-04-01', 'Platinam Stone', 'Opening', '0', 'Buyer opening'],
    ],
  };

  function colOf(row, aliases) {
    const keys = Object.keys(row || {});
    const norm = (s) =>
      String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    for (const a of aliases) {
      const na = norm(a);
      const k = keys.find((key) => {
        const nk = norm(key);
        return nk === na || nk.includes(na) || na.includes(nk);
      });
      if (k != null && row[k] !== '' && row[k] != null) return row[k];
    }
    return '';
  }

  function numIn(v) {
    if (v == null || v === '') return 0;
    const n = Number(String(v).replace(/[₹,\s]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function parseImportDate(v) {
    if (!v && v !== 0) return today();
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      let d = Number(m[1]);
      let mo = Number(m[2]);
      let y = m[3];
      if (y.length === 2) y = '20' + y;
      if (mo > 12 && d <= 12) {
        const t = d;
        d = mo;
        mo = t;
      }
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    const n = Number(s);
    if (n > 20000 && n < 80000) {
      const dt = new Date(Math.round((n - 25569) * 86400 * 1000));
      if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
    return today();
  }

  function parseCsvText(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let i = 0;
    let inQ = false;
    const s = String(text || '').replace(/^\uFEFF/, '');
    while (i < s.length) {
      const ch = s[i];
      if (inQ) {
        if (ch === '"') {
          if (s[i + 1] === '"') {
            cell += '"';
            i++;
          } else inQ = false;
        } else cell += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && s[i + 1] === '\n') i++;
        row.push(cell);
        cell = '';
        if (row.some((c) => String(c).trim() !== '')) rows.push(row);
        row = [];
      } else cell += ch;
      i++;
    }
    if (cell || row.length) {
      row.push(cell);
      if (row.some((c) => String(c).trim() !== '')) rows.push(row);
    }
    if (!rows.length) return [];
    const headers = rows[0].map((h) => String(h).trim());
    return rows.slice(1).map((r) => {
      const o = {};
      headers.forEach((h, idx) => {
        o[h] = r[idx] != null ? r[idx] : '';
      });
      return o;
    });
  }

  function parseImportFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const name = (file.name || '').toLowerCase();
      reader.onload = () => {
        try {
          if (name.endsWith('.csv') || file.type === 'text/csv') {
            const text =
              typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result);
            resolve(parseCsvText(text));
            return;
          }
          if (!window.XLSX) {
            reject(new Error('Excel reader not loaded — save the sheet as CSV'));
            return;
          }
          const wb = window.XLSX.read(reader.result, { type: 'array', cellDates: true });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          resolve(window.XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      if (name.endsWith('.csv')) reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    });
  }

  function renderImportPreview() {
    const wrap = $('#impPreviewWrap');
    const head = $('#impPreviewHead');
    const body = $('#impPreviewBody');
    if (!wrap || !head || !body) return;
    if (!importRows.length) {
      wrap.style.display = 'none';
      return;
    }
    const keys = Object.keys(importRows[0] || {});
    const sample = importRows.slice(0, 8);
    head.innerHTML = `<tr>${keys.map((k) => `<th>${k}</th>`).join('')}</tr>`;
    body.innerHTML = sample
      .map((r) => `<tr>${keys.map((k) => `<td>${String(r[k] ?? '')}</td>`).join('')}</tr>`)
      .join('');
    wrap.style.display = '';
    if ($('#impStatus')) {
      $('#impStatus').textContent = `${importRows.length} row${importRows.length === 1 ? '' : 's'} ready · showing first ${sample.length}`;
    }
  }

  function findPartyByName(name) {
    const n = String(name || '')
      .trim()
      .toLowerCase();
    if (!n) return null;
    return (state.parties || []).find((p) => (p.name || '').toLowerCase() === n) || null;
  }

  function ensureImportedParty(name, type) {
    let p = findPartyByName(name);
    if (p) return p;
    p = {
      id: uid(),
      name: String(name).trim(),
      type: /vendor|supplier/i.test(type || '') ? 'Vendor' : 'Customer',
      gstin: '—',
    };
    state.parties.push(p);
    return p;
  }

  function runImport(kind, qid) {
    const q = (state.quarries || []).find((x) => x.id === qid);
    if (!q) {
      toast('Select a quarry');
      return { ok: 0, skip: 0 };
    }
    let ok = 0;
    let skip = 0;
    if (kind === 'parties') {
      importRows.forEach((row) => {
        const name = String(colOf(row, ['name', 'party', 'customer', 'vendor']) || '').trim();
        if (!name) {
          skip++;
          return;
        }
        const typeRaw = String(colOf(row, ['type', 'partytype']) || 'Customer');
        const type = /vendor|supplier/i.test(typeRaw) ? 'Vendor' : 'Customer';
        const gstin = String(colOf(row, ['gstin', 'gst']) || '').trim() || '—';
        let p = findPartyByName(name);
        if (!p) {
          p = { id: uid(), name, type, gstin };
          state.parties.push(p);
        }
        p.type = type;
        if (gstin && gstin !== '—') p.gstin = gstin;
        p.phone = String(colOf(row, ['phone', 'mobile']) || p.phone || '').trim();
        p.state = String(colOf(row, ['state']) || p.state || '').trim();
        p.email = String(colOf(row, ['email']) || p.email || '').trim();
        const addr = String(colOf(row, ['address', 'billing']) || '').trim();
        if (addr) p.billingAddress = addr;
        ok++;
      });
    } else if (kind === 'staff') {
      if (!state.staff) state.staff = [];
      importRows.forEach((row) => {
        const name = String(colOf(row, ['name', 'staff', 'person']) || '').trim();
        if (!name) {
          skip++;
          return;
        }
        const catRaw = String(colOf(row, ['category', 'type']) || 'Staff');
        const dailyRate = numIn(colOf(row, ['dailyrate', 'dayrate', 'rate']));
        const category = /worker|labour|labor/i.test(catRaw) || dailyRate > 0 ? 'Worker' : 'Staff';
        const joinDate = parseImportDate(colOf(row, ['joindate', 'join', 'date']));
        let person = state.staff.find(
          (s) => s.quarryId === qid && (s.name || '').toLowerCase() === name.toLowerCase() && !s.exitDate
        );
        if (!person) {
          person = { id: uid(), quarryId: qid, name };
          state.staff.push(person);
        }
        Object.assign(person, {
          quarryId: qid,
          name,
          category,
          designation: String(colOf(row, ['designation', 'role', 'post']) || person.designation || '').trim(),
          basic: numIn(colOf(row, ['basic', 'salary'])) || person.basic || 0,
          dailyRate: dailyRate || person.dailyRate || 0,
          joinDate: joinDate || person.joinDate || today(),
          phone: String(colOf(row, ['phone', 'mobile']) || person.phone || '').trim(),
          bankName: String(colOf(row, ['bank', 'bankname']) || person.bankName || '').trim(),
          bankAc: String(colOf(row, ['account', 'ac', 'bankac']) || person.bankAc || '').trim(),
          ifsc: String(colOf(row, ['ifsc']) || person.ifsc || '').trim(),
        });
        ok++;
      });
      state.staff = normalizePeople(state.staff);
    } else if (kind === 'expenses') {
      if (!state.expenses) state.expenses = [];
      importRows.forEach((row) => {
        const date = parseImportDate(colOf(row, ['date']));
        const particulars = String(colOf(row, ['comment', 'particulars', 'narration', 'note', 'description']) || '').trim();
        const typeRaw = String(colOf(row, ['type', 'drcr']) || '').toLowerCase();
        let debit = numIn(colOf(row, ['debit', 'dr', 'expense', 'out']));
        let credit = numIn(colOf(row, ['credit', 'cr', 'in', 'receipt']));
        const amt = numIn(colOf(row, ['amount', 'amt']));
        const isCredit = /credit|cash.?in|receipt|sale/.test(typeRaw);
        if (!debit && !credit && amt) {
          if (isCredit) credit = amt;
          else debit = amt;
        }
        if (!debit && !credit) {
          skip++;
          return;
        }
        const type = credit && !debit ? 'Credit' : isCredit ? 'Credit' : 'Debit';
        if (type === 'Credit' && !credit && debit) {
          credit = debit;
          debit = 0;
        }
        const head =
          String(colOf(row, ['category', 'head', 'expensehead']) || '').trim() ||
          (type === 'Credit' ? 'Cash Received' : 'Other');
        const dup = state.expenses.some(
          (e) =>
            e.quarryId === qid &&
            e.date === date &&
            (e.particulars || '') === particulars &&
            Number(e.debit || 0) === debit &&
            Number(e.credit || 0) === credit
        );
        if (dup) {
          skip++;
          return;
        }
        if (!state.heads.includes(head)) state.heads.push(head);
        state.expenses.push({
          id: uid(),
          quarryId: qid,
          date,
          type,
          head,
          particulars: particulars || head,
          debit: type === 'Debit' ? debit : 0,
          credit: type === 'Credit' ? credit : 0,
        });
        ok++;
      });
    } else if (kind === 'markings') {
      if (!state.markings) state.markings = [];
      const gstDefault = quarryRates(qid).gstPct;
      importRows.forEach((row) => {
        const partyName = String(colOf(row, ['party', 'buyer', 'customer', 'name']) || '').trim();
        const blockNo = String(colOf(row, ['block', 'blockno', 'no']) || '').trim();
        const l = numIn(colOf(row, ['l', 'length']));
        const w = numIn(colOf(row, ['w', 'width']));
        const h = numIn(colOf(row, ['h', 'height']));
        if (!partyName || !blockNo || !l || !w || !h) {
          skip++;
          return;
        }
        const date = parseImportDate(colOf(row, ['date']));
        const dup = state.markings.some(
          (m) => m.quarryId === qid && m.date === date && String(m.blockNo) === blockNo
        );
        if (dup) {
          skip++;
          return;
        }
        const choice = String(colOf(row, ['choice', 'grade']) || 'I').trim() || 'I';
        const rate = numIn(colOf(row, ['rate', 'price'])) || defaultCbmRate(choice, qid);
        const gstPct = numIn(colOf(row, ['gst', 'gstpct', 'tax']));
        const party = ensureImportedParty(partyName, 'Customer');
        state.markings.push({
          id: uid(),
          quarryId: qid,
          date,
          partyId: party.id,
          blockNo,
          choice,
          l,
          w,
          h,
          rate,
          gstPct: gstPct || gstDefault,
          load: String(colOf(row, ['load', 'status']) || 'OK').trim() || 'OK',
        });
        ok++;
      });
    } else if (kind === 'openings') {
      if (!state.partyLedger) state.partyLedger = [];
      importRows.forEach((row) => {
        const partyName = String(colOf(row, ['party', 'name', 'vendor', 'customer']) || '').trim();
        const amount = numIn(colOf(row, ['amount', 'amt', 'opening']));
        if (!partyName || !amount) {
          skip++;
          return;
        }
        const kindRaw = String(colOf(row, ['kind', 'type']) || 'Bill');
        const isPay = /pay|receipt|debit/i.test(kindRaw);
        const party = ensureImportedParty(partyName, /vendor|supplier/i.test(kindRaw) ? 'Vendor' : 'Customer');
        const date = parseImportDate(colOf(row, ['date', 'asof']));
        const particulars =
          String(colOf(row, ['particulars', 'comment', 'note']) || '').trim() ||
          (isPay ? 'Opening payment' : 'Opening bill');
        state.partyLedger.push({
          id: uid(),
          quarryId: qid,
          partyId: party.id,
          date,
          particulars,
          debit: isPay ? amount : 0,
          credit: isPay ? 0 : amount,
          kind: isPay ? 'Payment' : 'Bill',
        });
        ok++;
      });
    }
    save(state);
    return { ok, skip };
  }

  $('#impTemplateBtn')?.addEventListener('click', () => {
    const kind = $('#impKind')?.value || 'expenses';
    const rows = IMPORT_TEMPLATES[kind];
    if (!rows) return;
    downloadCsv(`arun-${kind}-template.csv`, rows);
    toast('Template downloaded');
  });

  $('#impFile')?.addEventListener('change', async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      importRows = await parseImportFile(file);
      if (!importRows.length) {
        toast('No data rows in file');
        if ($('#impStatus')) $('#impStatus').textContent = 'No rows found.';
        return;
      }
      renderImportPreview();
      toast(`${importRows.length} rows loaded`);
    } catch (err) {
      toast(err.message || 'Could not read file');
    }
  });

  $('#impRunBtn')?.addEventListener('click', () => {
    if (!canEdit()) {
      toast('No permission to import');
      return;
    }
    if (!importRows.length) {
      toast('Choose an Excel or CSV file first');
      return;
    }
    const kind = $('#impKind')?.value || 'expenses';
    const qid = $('#impQuarry')?.value || state.activeQuarryId;
    const qname = state.quarries.find((x) => x.id === qid)?.name || 'quarry';
    const { ok, skip } = runImport(kind, qid);
    toast(`Imported ${ok} into ${qname}${skip ? ` · skipped ${skip}` : ''}`);
    if ($('#impStatus')) {
      $('#impStatus').textContent = `Imported ${ok} ${kind} into ${qname}${skip ? ` · skipped ${skip} duplicate/empty` : ''}.`;
    }
    importRows = [];
    if ($('#impFile')) $('#impFile').value = '';
    const wrap = $('#impPreviewWrap');
    if (wrap) wrap.style.display = 'none';
  });

  function userQuarryChecksHtml(selectedIds, allQuarries) {
    const all = allQuarries || (selectedIds || []).includes('*');
    const ids = new Set(selectedIds || []);
    return `<label class="field" style="flex-direction:row;align-items:center;gap:8px">
        <input type="checkbox" id="uAllQ" ${all ? 'checked' : ''} /> All quarries
      </label>
      <div id="uQList" class="list-compact" style="${all ? 'opacity:.5;pointer-events:none' : ''}">
        ${(state.quarries || [])
          .map(
            (q) => `<label class="list-row" style="align-items:center">
            <div><div class="t">${q.name}</div><div class="s">${q.code} · ${q.place}</div></div>
            <input type="checkbox" class="u-qid" data-qid="${q.id}" ${all || ids.has(q.id) ? 'checked' : ''} />
          </label>`
          )
          .join('')}
      </div>`;
  }

  function collectUserQuarries() {
    if ($('#uAllQ')?.checked || $('#uRole')?.value === 'Owner') return ['*'];
    return $$('.u-qid:checked').map((c) => c.dataset.qid);
  }

  function openUserModal(existing) {
    if (!isOwner()) {
      toast('Owner only');
      return;
    }
    const u = existing || {};
    const isNew = !existing;
    openModal(
      isNew ? 'Add user' : 'Edit user · ' + u.name,
      `<div class="form-grid cols-2">
        <label class="field"><span>Name *</span><input id="uName" value="${(u.name || '').replace(/"/g, '&quot;')}" /></label>
        <label class="field"><span>Username *</span><input id="uUser" value="${(u.username || '').replace(/"/g, '&quot;')}" autocomplete="off" /></label>
        <label class="field"><span>Password ${isNew ? '*' : '(leave blank to keep)'}</span><input id="uPass" type="password" autocomplete="new-password" /></label>
        <label class="field"><span>Role</span>
          <select id="uRole">
            <option value="Owner" ${u.role === 'Owner' ? 'selected' : ''}>Owner</option>
            <option value="Accountant" ${!u.role || u.role === 'Accountant' ? 'selected' : ''}>Accountant</option>
            <option value="Viewer" ${u.role === 'Viewer' ? 'selected' : ''}>Viewer</option>
          </select>
        </label>
        <label class="field" style="grid-column:1/-1"><span>Status</span>
          <select id="uActive">
            <option value="1" ${u.active !== false ? 'selected' : ''}>Active</option>
            <option value="0" ${u.active === false ? 'selected' : ''}>Disabled</option>
          </select>
        </label>
        <div style="grid-column:1/-1">
          <div style="font-size:.82rem;color:var(--muted);margin-bottom:6px">Quarry access</div>
          ${userQuarryChecksHtml(u.quarryIds, u.role === 'Owner' || (u.quarryIds || []).includes('*'))}
        </div>
      </div>`,
      () => {
        const name = ($('#uName')?.value || '').trim();
        const username = ($('#uUser')?.value || '').trim().toLowerCase();
        const pass = $('#uPass')?.value || '';
        const role = $('#uRole')?.value || 'Accountant';
        if (!name || !username) {
          toast('Name and username required');
          return false;
        }
        if (isNew && !pass) {
          toast('Password required');
          return false;
        }
        const taken = (state.users || []).some(
          (x) => (x.username || '').toLowerCase() === username && x.id !== u.id
        );
        if (taken) {
          toast('Username already used');
          return false;
        }
        let quarryIds = collectUserQuarries();
        if (role === 'Owner') quarryIds = ['*'];
        if (!quarryIds.length) {
          toast('Select at least one quarry');
          return false;
        }
        if (isNew) {
          state.users.push({
            id: uid(),
            name,
            username,
            password: pass,
            role,
            quarryIds,
            lastQuarryId: quarryIds[0] === '*' ? state.quarries[0]?.id : quarryIds[0],
            active: $('#uActive')?.value !== '0',
          });
          toast('User added · ' + username);
        } else {
          u.name = name;
          u.username = username;
          if (pass) u.password = pass;
          u.role = role;
          u.quarryIds = quarryIds;
          u.active = $('#uActive')?.value !== '0';
          toast('User updated · ' + username);
        }
        return true;
      },
      { large: true, onAfterSave: () => renderUsers() }
    );
    const syncAll = () => {
      const all = $('#uAllQ')?.checked || $('#uRole')?.value === 'Owner';
      if ($('#uAllQ') && $('#uRole')?.value === 'Owner') $('#uAllQ').checked = true;
      const list = $('#uQList');
      if (list) {
        list.style.opacity = all ? '.5' : '1';
        list.style.pointerEvents = all ? 'none' : '';
      }
    };
    $('#uAllQ')?.addEventListener('change', syncAll);
    $('#uRole')?.addEventListener('change', syncAll);
  }

  function renderUsers() {
    if (!isOwner()) return;
    const q = ($('#userSearch')?.value || '').toLowerCase();
    let list = [...(state.users || [])];
    if (q) {
      list = list.filter((u) => `${u.name} ${u.username} ${u.role}`.toLowerCase().includes(q));
    }
    if ($('#userStats')) {
      $('#userStats').innerHTML = `
        <div class="card"><h3>Users</h3><div class="stat">${(state.users || []).length}</div></div>
        <div class="card"><h3>Owners</h3><div class="stat">${(state.users || []).filter((u) => u.role === 'Owner').length}</div></div>
        <div class="card"><h3>Accountants</h3><div class="stat">${(state.users || []).filter((u) => u.role === 'Accountant').length}</div></div>
        <div class="card"><h3>Viewers</h3><div class="stat">${(state.users || []).filter((u) => u.role === 'Viewer').length}</div></div>`;
    }
    if ($('#userTable')) {
      $('#userTable').innerHTML = list
        .map(
          (u) => `<tr>
            <td><strong>${u.name}</strong>${u.id === sessionUserId ? ' · you' : ''}</td>
            <td>${u.username}</td>
            <td>${u.role}</td>
            <td>${quarryAccessLabel(u)}</td>
            <td>${u.active === false ? '<span class="badge danger">Disabled</span>' : '<span class="badge ok">Active</span>'}</td>
            <td>
              <button type="button" class="btn btn-ghost btn-sm" data-uedit="${u.id}">Edit</button>
              ${
                u.id === sessionUserId
                  ? ''
                  : `<button type="button" class="btn btn-ghost btn-sm" data-udel="${u.id}">Delete</button>`
              }
            </td>
          </tr>`
        )
        .join('');
      $$('#userTable [data-uedit]').forEach((b) =>
        b.addEventListener('click', () => {
          const user = state.users.find((x) => x.id === b.dataset.uedit);
          if (user) openUserModal(user);
        })
      );
      $$('#userTable [data-udel]').forEach((b) =>
        b.addEventListener('click', () => {
          const user = state.users.find((x) => x.id === b.dataset.udel);
          if (!user) return;
          if (user.role === 'Owner' && (state.users || []).filter((x) => x.role === 'Owner' && x.active !== false).length <= 1) {
            toast('Keep at least one Owner');
            return;
          }
          if (!confirm('Delete login ' + user.username + '?')) return;
          state.users = state.users.filter((x) => x.id !== user.id);
          save(state);
          toast('User deleted');
          renderUsers();
        })
      );
    }
  }

  $('#addUserBtn')?.addEventListener('click', () => openUserModal());
  $('#userSearch')?.addEventListener('input', renderUsers);

  const PL_EXCLUDE_HEADS = new Set([
    'Vendor Payment',
    'Salary Advance',
    'Labour Advance',
  ]);

  function isPlOperatingExpense(e) {
    if (!e || e.type !== 'Debit') return false;
    const head = e.head || 'Other';
    if (PL_EXCLUDE_HEADS.has(head)) return false;
    return true;
  }

  function renderReports() {
    ensureReportYearOptions();
    const fy = activeYear();
    const q = activeQuarry();
    if ($('#reportPill')) $('#reportPill').textContent = q.name;
    if ($('#plStmtHint')) $('#plStmtHint').textContent = `FY ${fy}`;

    const ex = dashExpenses();
    const marks = dashMarkings();
    const salesGross = marks.reduce((s, m) => s + markGross(m), 0);
    const salesGst = marks.reduce((s, m) => s + markGstAmt(m), 0);
    const salesTotal = salesGross + salesGst;
    const totalCbm = marks.reduce((s, m) => s + volCBM(m), 0);
    const royalty = totalCbm * quarryRates().royaltyRate;
    const rent = quarryMachineReadings()
      .filter((r) => inFy(r.date || `${readingMonth(r)}-01`, fy))
      .reduce((s, r) => s + Number(r.rent || 0), 0);

    const cashCredit = ex.reduce((s, e) => s + (Number(e.credit) || 0), 0);
    const cashDebit = ex.reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const settlements = ex
      .filter((e) => e.type === 'Debit' && PL_EXCLUDE_HEADS.has(e.head || ''))
      .reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const operatingByHead = {};
    ex.filter(isPlOperatingExpense).forEach((e) => {
      const head = e.head || 'Other';
      operatingByHead[head] = (operatingByHead[head] || 0) + (Number(e.debit) || 0);
    });
    const operatingRows = Object.entries(operatingByHead).sort((a, b) => b[1] - a[1]);
    const operating = operatingRows.reduce((s, [, v]) => s + v, 0);
    const totalCosts = royalty + rent + operating;
    const pl = salesGross - totalCosts;

    $('#plCards').innerHTML = `
      <div class="card"><h3>Sales (ex-GST)</h3><div class="stat ok">${money(salesGross)}</div><div class="hint">${marks.length} blocks · ${cbm(totalCbm)} CBM · GST ${money(salesGst)}</div></div>
      <div class="card"><h3>Total costs</h3><div class="stat danger">${money(totalCosts)}</div><div class="hint">Royalty · Rent · Operating</div></div>
      <div class="card"><h3>Indicative P&amp;L</h3><div class="stat ${pl >= 0 ? 'ok' : 'danger'}">${money(pl)}</div><div class="hint">FY ${fy} · ${q.name}</div></div>
      <div class="card"><h3>Net cash</h3><div class="stat ${cashCredit - cashDebit >= 0 ? 'ok' : 'danger'}">${money(cashCredit - cashDebit)}</div><div class="hint">In ${money(cashCredit)} · Out ${money(cashDebit)}</div></div>`;

    const stmtRow = (label, amt, opts = {}) => {
      const cls = opts.strong ? ' style="font-weight:700"' : '';
      const muted = opts.muted ? ' style="color:var(--muted)"' : '';
      const numCls = opts.neg ? 'neg' : opts.pos ? 'pos' : '';
      return `<tr${cls}${muted}><td>${label}</td><td class="num ${numCls}">${opts.blank ? '—' : money(amt)}</td></tr>`;
    };

    if ($('#plStmtTable')) {
      $('#plStmtTable').innerHTML = [
        stmtRow('Block marking sales (ex-GST)', salesGross, { pos: true }),
        stmtRow('GST on markings (memo)', salesGst, { muted: true }),
        stmtRow('Invoice value (incl. GST)', salesTotal, { muted: true }),
        `<tr><td colspan="2" style="padding:4px 14px;color:var(--muted);font-size:.75rem">Less costs</td></tr>`,
        stmtRow('Royalty due', royalty, { neg: true }),
        stmtRow('Machinery rent (readings)', rent, { neg: true }),
        stmtRow('Operating expenses (cash)', operating, { neg: true }),
        stmtRow('Indicative P&L', pl, { strong: true, pos: pl >= 0, neg: pl < 0 }),
      ].join('');
    }

    if ($('#plCashTable')) {
      $('#plCashTable').innerHTML = [
        stmtRow('Cash receipts (credit)', cashCredit, { pos: true }),
        stmtRow('Cash payments (debit)', cashDebit, { neg: true }),
        stmtRow('Of which settlements*', settlements, { muted: true }),
        stmtRow('Net cash movement', cashCredit - cashDebit, {
          strong: true,
          pos: cashCredit - cashDebit >= 0,
          neg: cashCredit - cashDebit < 0,
        }),
        `<tr><td colspan="2" style="padding:8px 14px;color:var(--muted);font-size:.75rem">* Vendor payment, salary advance, labour advance</td></tr>`,
      ].join('');
    }

    const costTotal = totalCosts || 1;
    const costLines = [
      ['Royalty', royalty],
      ['Machinery rent', rent],
      ...operatingRows,
    ].filter(([, v]) => v > 0);
    if ($('#plCostTable')) {
      $('#plCostTable').innerHTML = costLines.length
        ? costLines
            .map(
              ([name, amt]) =>
                `<tr><td>${name}</td><td class="num">${money(amt)}</td><td class="num">${Math.round((amt / costTotal) * 100)}%</td></tr>`
            )
            .join('') +
            `<tr style="font-weight:700"><td>Total</td><td class="num">${money(totalCosts)}</td><td class="num">100%</td></tr>`
        : `<tr><td colspan="3"><div class="empty">No costs this FY</div></td></tr>`;
    }

    if (typeof Chart !== 'undefined' && costLines.length) {
      paintDashChart('plExpense', '#plExpenseChart', {
        type: 'doughnut',
        data: {
          labels: costLines.map(([n]) => n),
          datasets: [
            {
              data: costLines.map(([, v]) => v),
              backgroundColor: costLines.map((_, i) => DASH_CHART_COLORS[i % DASH_CHART_COLORS.length]),
              borderWidth: 2,
              borderColor: '#fff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
                  const v = ctx.parsed || 0;
                  return `${ctx.label}: ${money(v)} (${Math.round((v / total) * 100)}%)`;
                },
              },
            },
          },
        },
      });
    } else {
      emptyDashChart('plExpense', '#plExpenseChart', 'No operating costs this FY');
    }
  }

  /* ---------- Proforma Invoice (Vyapar-style editor) ---------- */
  let piDraft = null;
  let piMountedId = null;

  function piEsc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function piMoney(n) {
    return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function piTypeLabel(t) {
    if (t === 'slab') return 'Slab (SQF)';
    if (t === 'export') return 'Export';
    return 'Block (CBM)';
  }

  function quarryInvoices() {
    return (state.invoices || []).filter((i) => i.quarryId === state.activeQuarryId);
  }

  function nextPiRef() {
    const fy = fyFromDate(today());
    const nums = quarryInvoices()
      .filter((i) => fyFromDate(i.date) === fy)
      .map((i) => parseInt(i.refNo, 10) || 0);
    return String((nums.length ? Math.max(...nums) : 0) + 1);
  }

  function emptyPiLine(type) {
    return {
      id: uid(),
      item: '',
      qty: '',
      unit: type === 'slab' ? 'SQF' : 'CBM',
      price: type === 'slab' ? quarryRates().slabRate : '',
      discPct: '',
      discAmt: '',
      taxPct: quarryRates().gstPct,
      hsn: type === 'export' ? '2516' : '',
      markingId: '',
    };
  }

  function newPiDraft() {
    const co = companyOf();
    return {
      id: 'new',
      quarryId: state.activeQuarryId,
      type: 'block',
      refNo: nextPiRef(),
      date: today(),
      partyId: '',
      stateOfSupply: co.state || 'Tamil Nadu',
      priceWithTax: false,
      lines: [emptyPiLine('block'), emptyPiLine('block')],
      terms: '',
      description: '',
      imageData: '',
      documentName: '',
      documentData: '',
      roundOff: true,
      orderNo: '',
      orderDate: '',
      fob: 'CHENNAI PORT',
      paymentTerms: '',
      currency: 'INR',
      ieCode: co.ieCode || COMPANY.ieCode,
      status: 'draft',
    };
  }

  function loadPiDraft(id) {
    if (!id || id === 'new') {
      piDraft = newPiDraft();
      return;
    }
    const inv = (state.invoices || []).find((x) => x.id === id);
    piDraft = inv ? JSON.parse(JSON.stringify(inv)) : newPiDraft();
    if (!piDraft.lines || !piDraft.lines.length) {
      piDraft.lines = [emptyPiLine(piDraft.type), emptyPiLine(piDraft.type)];
    }
  }

  function lineCalc(line, priceWithTax) {
    const qty = Number(line.qty) || 0;
    const price = Number(line.price) || 0;
    const taxPct = Number(line.taxPct) || 0;
    const base = qty * price;
    let discAmt = Number(line.discAmt) || 0;
    if (line._discFromPct) {
      discAmt = base * ((Number(line.discPct) || 0) / 100);
    }
    const net = Math.max(0, base - discAmt);
    let taxable;
    let taxAmt;
    let amount;
    if (priceWithTax) {
      amount = net;
      taxable = taxPct ? amount / (1 + taxPct / 100) : amount;
      taxAmt = amount - taxable;
    } else {
      taxable = net;
      taxAmt = taxable * (taxPct / 100);
      amount = taxable + taxAmt;
    }
    return { qty, base, discAmt, taxable, taxAmt, amount };
  }

  function invoiceTotals(inv) {
    let qty = 0;
    let disc = 0;
    let tax = 0;
    let taxable = 0;
    let amount = 0;
    (inv.lines || []).forEach((line) => {
      const c = lineCalc(line, inv.priceWithTax);
      qty += c.qty;
      disc += c.discAmt;
      tax += c.taxAmt;
      taxable += c.taxable;
      amount += c.amount;
    });
    let roundAmt = 0;
    let total = amount;
    if (inv.roundOff) {
      const rounded = Math.round(amount);
      roundAmt = +(rounded - amount).toFixed(2);
      total = rounded;
    }
    const coState = companyOf().state || 'Tamil Nadu';
    const intra = !inv.stateOfSupply || inv.stateOfSupply === coState;
    return {
      qty,
      disc,
      tax,
      taxable,
      amount,
      roundAmt,
      total,
      intra,
      cgst: intra ? tax / 2 : 0,
      sgst: intra ? tax / 2 : 0,
      igst: intra ? 0 : tax,
    };
  }

  function piPartyOptions(selectedId) {
    const list = state.parties.filter(isCustomerParty).sort((a, b) => a.name.localeCompare(b.name));
    return (
      `<option value="">Select</option>` +
      list
        .map((p) => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${piEsc(p.name)}</option>`)
        .join('') +
      `<option value="__new__">+ Add party…</option>`
    );
  }

  function piLineRowHtml(line, idx) {
    const unitOpts = PI_UNITS.map(
      (u) => `<option value="${u}" ${line.unit === u ? 'selected' : ''}>${u}</option>`
    ).join('');
    const taxOpts = PI_TAX.map(
      (t) => `<option value="${t}" ${String(line.taxPct) === t ? 'selected' : ''}>${t}%</option>`
    ).join('');
    return `<tr data-line="${line.id}">
      <td class="pi-idx">${idx + 1}</td>
      <td><input class="pi-item" placeholder="Item name" value="${piEsc(line.item)}" /></td>
      <td><input class="pi-qty num" type="number" min="0" step="0.001" value="${line.qty === '' || line.qty == null ? '' : line.qty}" /></td>
      <td><select class="pi-unit">${unitOpts}</select></td>
      <td><input class="pi-price num" type="number" min="0" step="0.01" value="${line.price === '' || line.price == null ? '' : line.price}" /></td>
      <td><input class="pi-dpct num" type="number" min="0" step="0.01" value="${line.discPct === '' || line.discPct == null ? '' : line.discPct}" /></td>
      <td><input class="pi-damt num" type="number" min="0" step="0.01" value="${line.discAmt === '' || line.discAmt == null ? '' : line.discAmt}" /></td>
      <td><select class="pi-tax"><option value="">Select</option>${taxOpts}</select></td>
      <td class="num pi-taxamt">0.00</td>
      <td class="num pi-amt">0.00</td>
      <td><button type="button" class="pi-del" title="Remove">✕</button></td>
    </tr>`;
  }

  function piEditorHtml() {
    const d = piDraft;
    const co = companyOf();
    const states = INDIA_STATES.map(
      (s) => `<option value="${s}" ${d.stateOfSupply === s ? 'selected' : ''}>${s}</option>`
    ).join('');
    const typeBtn = (key, label) =>
      `<button type="button" data-pitype="${key}" class="${d.type === key ? 'active' : ''}">${label}</button>`;
    return `<div class="pi-editor">
      <div class="pi-editor-head">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <button type="button" class="btn btn-ghost btn-sm" id="piBack">← Invoices</button>
          <h1>Proforma Invoice</h1>
        </div>
        <div class="pi-type-tabs">
          ${typeBtn('block', 'Block · CBM')}
          ${typeBtn('slab', 'Slab · SQF')}
          ${typeBtn('export', 'Export')}
        </div>
      </div>
      <div class="pi-sheet">
        <div class="pi-meta">
          <label class="pi-field pi-party-field">
            <span>Party <em class="req">*</em></span>
            <select id="piParty">${piPartyOptions(d.partyId)}</select>
          </label>
          <div class="pi-meta-right">
            <label class="pi-field"><span>Ref No.</span><input id="piRef" value="${piEsc(d.refNo)}" /></label>
            <label class="pi-field"><span>Invoice Date</span><input type="date" id="piDate" value="${d.date || today()}" /></label>
            <label class="pi-field"><span>State of supply</span><select id="piState"><option value="">Select</option>${states}</select></label>
          </div>
        </div>
        <div class="pi-export-row" id="piExportRow" style="${d.type === 'export' ? '' : 'display:none'}">
          <label class="pi-field"><span>Buyer’s order no.</span><input id="piOrderNo" value="${piEsc(d.orderNo)}" /></label>
          <label class="pi-field"><span>Order date</span><input type="date" id="piOrderDate" value="${piEsc(d.orderDate)}" /></label>
          <label class="pi-field"><span>F.O.B.</span><input id="piFob" value="${piEsc(d.fob)}" placeholder="CHENNAI PORT" /></label>
          <label class="pi-field"><span>IE code</span><input id="piIe" value="${piEsc(d.ieCode || co.ieCode)}" /></label>
          <label class="pi-field"><span>Payment terms</span><input id="piPayTerms" value="${piEsc(d.paymentTerms)}" /></label>
          <label class="pi-field"><span>Currency</span>
            <select id="piCur"><option value="INR" ${d.currency !== 'USD' ? 'selected' : ''}>INR</option><option value="USD" ${d.currency === 'USD' ? 'selected' : ''}>USD</option></select>
          </label>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:6px">
          <button type="button" class="pi-from-mark" id="piFromMark">+ Add from marking</button>
        </div>
        <div class="pi-table-wrap">
          <table class="pi-table">
            <thead>
              <tr>
                <th rowspan="2">#</th>
                <th rowspan="2">Item</th>
                <th rowspan="2" class="num">Qty</th>
                <th rowspan="2">Unit</th>
                <th rowspan="2">
                  Price/unit
                  <div>
                    <select id="piPriceTax" style="font-size:11px;min-height:24px;padding:2px 4px;border:1px solid #dadce0;background:#fff;width:auto">
                      <option value="0" ${!d.priceWithTax ? 'selected' : ''}>Without Tax</option>
                      <option value="1" ${d.priceWithTax ? 'selected' : ''}>With Tax</option>
                    </select>
                  </div>
                </th>
                <th colspan="2">Discount</th>
                <th colspan="2">Tax</th>
                <th rowspan="2" class="num">Amount</th>
                <th rowspan="2"><button type="button" class="pi-col-add" id="piAddRowTop" title="Add row">+</button></th>
              </tr>
              <tr class="pi-sub">
                <th class="num">%</th>
                <th class="num">Amount</th>
                <th>%</th>
                <th class="num">Amount</th>
              </tr>
            </thead>
            <tbody id="piLines">${d.lines.map((l, i) => piLineRowHtml(l, i)).join('')}</tbody>
            <tfoot>
              <tr>
                <td colspan="2">TOTAL</td>
                <td class="num" id="piTotQty">0</td>
                <td colspan="3"></td>
                <td class="num" id="piTotDisc">0.00</td>
                <td></td>
                <td class="num" id="piTotTax">0.00</td>
                <td class="num" id="piTotAmt">0.00</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button type="button" class="pi-add-row" id="piAddRow">ADD ROW</button>
        <div class="pi-extras">
          <div>
            <button type="button" class="pi-extra-btn" id="piTermsBtn"><span class="ico">☰</span> ADD TERMS &amp; CONDITIONS</button>
            <div class="pi-extra-panel ${d.terms ? 'open' : ''}" id="piTermsPanel">
              <textarea id="piTerms" placeholder="Payment terms, jurisdiction…">${piEsc(d.terms).replace(/&quot;/g, '"')}</textarea>
            </div>
          </div>
          <div class="pi-extra-stack">
            <button type="button" class="pi-extra-btn" id="piDescBtn"><span class="ico">▤</span> ADD DESCRIPTION</button>
            <div class="pi-extra-panel ${d.description ? 'open' : ''}" id="piDescPanel">
              <textarea id="piDesc" placeholder="Material name, marked by, no. of blocks…">${piEsc(d.description).replace(/&quot;/g, '"')}</textarea>
            </div>
            <button type="button" class="pi-extra-btn" id="piImgBtn"><span class="ico">▣</span> ADD IMAGE</button>
            <input type="file" id="piImgFile" accept="image/*" hidden />
            <div id="piImgWrap">${d.imageData ? `<img class="pi-img-preview" src="${d.imageData}" alt="Attachment" />` : ''}</div>
            <button type="button" class="pi-extra-btn" id="piDocBtn"><span class="ico">▭</span> ADD DOCUMENT</button>
            <input type="file" id="piDocFile" accept=".pdf,.doc,.docx,image/*" hidden />
            <div id="piDocWrap" style="font-size:12px;color:#5f6368">${d.documentName ? piEsc(d.documentName) : ''}</div>
          </div>
          <div class="pi-totals">
            <label class="pi-round">
              <input type="checkbox" id="piRound" ${d.roundOff ? 'checked' : ''} /> Round Off
              <input type="number" id="piRoundAmt" step="0.01" readonly />
            </label>
            <div class="pi-grand">Total <input id="piGrand" readonly /></div>
            <div class="pi-tax-break" id="piTaxBreak"></div>
          </div>
        </div>
      </div>
      <div class="pi-bar">
        <div class="pi-share-wrap" id="piShareWrap">
          <button type="button" class="btn-share" id="piShareBtn">Share ▾</button>
          <div class="pi-share-menu">
            <button type="button" id="piPrintBtn">Print / PDF</button>
            <button type="button" id="piExcelBtn">Excel</button>
          </div>
        </div>
        <button type="button" class="btn-save" id="piSaveBtn">Save</button>
      </div>
    </div>`;
  }

  function paintPiCalcs() {
    if (!piDraft) return;
    const t = invoiceTotals(piDraft);
    $$('#piLines tr').forEach((tr) => {
      const line = piDraft.lines.find((l) => l.id === tr.dataset.line);
      if (!line) return;
      const c = lineCalc(line, piDraft.priceWithTax);
      const taxCell = tr.querySelector('.pi-taxamt');
      const amtCell = tr.querySelector('.pi-amt');
      if (taxCell) taxCell.textContent = c.taxAmt ? piMoney(c.taxAmt) : '0.00';
      if (amtCell) amtCell.textContent = c.amount ? piMoney(c.amount) : '0.00';
      const damt = tr.querySelector('.pi-damt');
      if (damt && document.activeElement !== damt) damt.value = c.discAmt ? Number(c.discAmt.toFixed(2)) : '';
    });
    if ($('#piTotQty')) $('#piTotQty').textContent = t.qty ? Number(t.qty.toFixed(3)) : '0';
    if ($('#piTotDisc')) $('#piTotDisc').textContent = piMoney(t.disc);
    if ($('#piTotTax')) $('#piTotTax').textContent = piMoney(t.tax);
    if ($('#piTotAmt')) $('#piTotAmt').textContent = piMoney(t.amount);
    if ($('#piRoundAmt')) $('#piRoundAmt').value = t.roundAmt ? t.roundAmt.toFixed(2) : '0.00';
    if ($('#piGrand')) $('#piGrand').value = piMoney(t.total);
    if ($('#piTaxBreak')) {
      $('#piTaxBreak').textContent = t.intra
        ? `CGST ${piMoney(t.cgst)} · SGST ${piMoney(t.sgst)}`
        : `IGST ${piMoney(t.igst)}`;
    }
  }

  function syncPiHeader() {
    if (!piDraft) return;
    piDraft.partyId = $('#piParty')?.value || '';
    piDraft.refNo = $('#piRef')?.value || '';
    piDraft.date = $('#piDate')?.value || today();
    piDraft.stateOfSupply = $('#piState')?.value || '';
    piDraft.priceWithTax = $('#piPriceTax')?.value === '1';
    piDraft.roundOff = !!$('#piRound')?.checked;
    piDraft.terms = $('#piTerms')?.value || '';
    piDraft.description = $('#piDesc')?.value || '';
    if ($('#piOrderNo')) piDraft.orderNo = $('#piOrderNo').value;
    if ($('#piOrderDate')) piDraft.orderDate = $('#piOrderDate').value;
    if ($('#piFob')) piDraft.fob = $('#piFob').value;
    if ($('#piIe')) piDraft.ieCode = $('#piIe').value;
    if ($('#piPayTerms')) piDraft.paymentTerms = $('#piPayTerms').value;
    if ($('#piCur')) piDraft.currency = $('#piCur').value;
  }

  function syncPiLine(tr, fromPct) {
    const line = piDraft.lines.find((l) => l.id === tr.dataset.line);
    if (!line) return;
    line.item = tr.querySelector('.pi-item')?.value || '';
    line.qty = tr.querySelector('.pi-qty')?.value;
    line.unit = tr.querySelector('.pi-unit')?.value || 'NONE';
    line.price = tr.querySelector('.pi-price')?.value;
    line.taxPct = tr.querySelector('.pi-tax')?.value || 0;
    if (fromPct) {
      line._discFromPct = true;
      line.discPct = tr.querySelector('.pi-dpct')?.value;
    } else {
      line._discFromPct = false;
      line.discAmt = tr.querySelector('.pi-damt')?.value;
      const base = (Number(line.qty) || 0) * (Number(line.price) || 0);
      line.discPct = base ? +(((Number(line.discAmt) || 0) / base) * 100).toFixed(2) : 0;
      const dp = tr.querySelector('.pi-dpct');
      if (dp && document.activeElement !== dp) dp.value = line.discPct || '';
    }
  }

  function wirePiLine(tr) {
    tr.querySelector('.pi-item')?.addEventListener('input', () => syncPiLine(tr));
    tr.querySelector('.pi-qty')?.addEventListener('input', () => {
      syncPiLine(tr, true);
      paintPiCalcs();
    });
    tr.querySelector('.pi-price')?.addEventListener('input', () => {
      syncPiLine(tr, true);
      paintPiCalcs();
    });
    tr.querySelector('.pi-unit')?.addEventListener('change', () => syncPiLine(tr));
    tr.querySelector('.pi-tax')?.addEventListener('change', () => {
      syncPiLine(tr);
      paintPiCalcs();
    });
    tr.querySelector('.pi-dpct')?.addEventListener('input', () => {
      syncPiLine(tr, true);
      paintPiCalcs();
    });
    tr.querySelector('.pi-damt')?.addEventListener('input', () => {
      syncPiLine(tr, false);
      paintPiCalcs();
    });
    tr.querySelector('.pi-del')?.addEventListener('click', () => {
      if (piDraft.lines.length <= 1) {
        toast('Keep at least one row');
        return;
      }
      piDraft.lines = piDraft.lines.filter((l) => l.id !== tr.dataset.line);
      tr.remove();
      $$('#piLines tr').forEach((row, i) => {
        const idx = row.querySelector('.pi-idx');
        if (idx) idx.textContent = String(i + 1);
      });
      paintPiCalcs();
    });
  }

  function addPiRow() {
    const line = emptyPiLine(piDraft.type);
    piDraft.lines.push(line);
    $('#piLines')?.insertAdjacentHTML('beforeend', piLineRowHtml(line, piDraft.lines.length - 1));
    const tr = $('#piLines')?.lastElementChild;
    if (tr) {
      wirePiLine(tr);
      tr.querySelector('.pi-item')?.focus();
    }
    paintPiCalcs();
  }

  function bindPiEditor() {
    $('#piBack')?.addEventListener('click', () => go('invoices'));
    $$('[data-pitype]').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncPiHeader();
        piDraft.type = btn.dataset.pitype;
        piDraft.lines.forEach((l) => {
          if (!l.item && !l.qty && !l.price) l.unit = piDraft.type === 'slab' ? 'SQF' : 'CBM';
        });
        piMountedId = null;
        renderPiEditor();
      });
    });
    $('#piParty')?.addEventListener('change', () => {
      if ($('#piParty').value === '__new__') {
        $('#piParty').value = piDraft.partyId || '';
        openAddPartyModal({
          defaultType: 'Customer',
          onSaved: (party) => {
            if (!party?.id) return;
            piDraft.partyId = party.id;
            const sel = $('#piParty');
            if (sel) {
              sel.innerHTML = piPartyOptions(party.id);
              sel.value = party.id;
            }
            toast('Party · ' + party.name);
          },
        });
        return;
      }
      piDraft.partyId = $('#piParty').value;
      const p = state.parties.find((x) => x.id === piDraft.partyId);
      if (p?.state && $('#piState') && !$('#piState').value) {
        $('#piState').value = p.state;
        piDraft.stateOfSupply = p.state;
        paintPiCalcs();
      }
    });
    ['#piRef', '#piDate', '#piState', '#piOrderNo', '#piOrderDate', '#piFob', '#piIe', '#piPayTerms', '#piCur', '#piTerms', '#piDesc'].forEach(
      (sel) => {
        $(sel)?.addEventListener('input', syncPiHeader);
        $(sel)?.addEventListener('change', () => {
          syncPiHeader();
          paintPiCalcs();
        });
      }
    );
    $('#piPriceTax')?.addEventListener('change', () => {
      syncPiHeader();
      paintPiCalcs();
    });
    $('#piRound')?.addEventListener('change', () => {
      syncPiHeader();
      paintPiCalcs();
    });
    $$('#piLines tr').forEach(wirePiLine);
    $('#piAddRow')?.addEventListener('click', addPiRow);
    $('#piAddRowTop')?.addEventListener('click', addPiRow);
    $('#piTermsBtn')?.addEventListener('click', () => $('#piTermsPanel')?.classList.toggle('open'));
    $('#piDescBtn')?.addEventListener('click', () => $('#piDescPanel')?.classList.toggle('open'));
    $('#piImgBtn')?.addEventListener('click', () => $('#piImgFile')?.click());
    $('#piDocBtn')?.addEventListener('click', () => $('#piDocFile')?.click());
    $('#piImgFile')?.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > 900000) {
        toast('Image too large (keep under 900 KB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        piDraft.imageData = reader.result;
        if ($('#piImgWrap')) $('#piImgWrap').innerHTML = `<img class="pi-img-preview" src="${piDraft.imageData}" alt="" />`;
        toast('Image attached');
      };
      reader.readAsDataURL(f);
    });
    $('#piDocFile')?.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > 900000) {
        toast('Document too large (keep under 900 KB)');
        return;
      }
      piDraft.documentName = f.name;
      const reader = new FileReader();
      reader.onload = () => {
        piDraft.documentData = reader.result;
        if ($('#piDocWrap')) $('#piDocWrap').textContent = f.name;
        toast('Document attached');
      };
      reader.readAsDataURL(f);
    });
    $('#piFromMark')?.addEventListener('click', addPiFromMarking);
    $('#piShareBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      $('#piShareWrap')?.classList.toggle('open');
    });
    $('#piPrintBtn')?.addEventListener('click', () => {
      syncPiHeader();
      printPi(piDraft);
    });
    $('#piExcelBtn')?.addEventListener('click', () => {
      syncPiHeader();
      exportPiExcel(piDraft);
    });
    $('#piSaveBtn')?.addEventListener('click', savePiDraft);
  }

  function addPiFromMarking() {
    syncPiHeader();
    if (!piDraft.partyId) {
      toast('Select party first');
      return;
    }
    const used = new Set(piDraft.lines.map((l) => l.markingId).filter(Boolean));
    const marks = quarryMarkings().filter((m) => m.partyId === piDraft.partyId && !used.has(m.id));
    if (!marks.length) {
      toast('No remaining markings for this party');
      return;
    }
    piDraft.lines = piDraft.lines.filter((l) => l.item || l.qty || l.price);
    marks.forEach((m) => {
      piDraft.lines.push({
        id: uid(),
        item: `${m.blockNo} — ${m.choice || ''} ${m.l}×${m.w}×${m.h}`.replace(/\s+/g, ' ').trim(),
        qty: +volCBM(m).toFixed(3),
        unit: 'CBM',
        price: Number(m.rate) || 0,
        discPct: 0,
        discAmt: 0,
        taxPct: markGstPct(m),
        hsn: '2516',
        markingId: m.id,
      });
    });
    if (!piDraft.lines.length) piDraft.lines = [emptyPiLine(piDraft.type)];
    piMountedId = null;
    renderPiEditor();
    toast(`${marks.length} block(s) added`);
  }

  function savePiDraft() {
    if (!canEdit()) {
      toast('View-only login');
      return;
    }
    syncPiHeader();
    if (!piDraft.partyId || piDraft.partyId === '__new__') {
      toast('Party is required');
      $('#piParty')?.focus();
      return;
    }
    const rec = JSON.parse(JSON.stringify(piDraft));
    delete rec._discFromPct;
    rec.lines.forEach((l) => delete l._discFromPct);
    rec.quarryId = state.activeQuarryId;
    rec.status = 'saved';
    if (!rec.id || rec.id === 'new') rec.id = uid();
    if (!Array.isArray(state.invoices)) state.invoices = [];
    const idx = state.invoices.findIndex((i) => i.id === rec.id);
    if (idx >= 0) state.invoices[idx] = rec;
    else state.invoices.push(rec);
    save(state);
    piDraft = JSON.parse(JSON.stringify(rec));
    selectedPiId = rec.id;
    piMountedId = null;
    if ((location.hash || '').replace(/^#/, '') !== `pi/${rec.id}`) {
      history.replaceState(null, '', `#pi/${rec.id}`);
    }
    toast('Proforma invoice saved · Ref ' + rec.refNo);
    renderPiEditor();
  }

  function printPi(inv) {
    const party = state.parties.find((p) => p.id === inv.partyId);
    const co = companyOf();
    const t = invoiceTotals(inv);
    const fy = fyFromDate(inv.date) || activeYear();
    const unit = inv.type === 'slab' ? 'SQF' : 'CBM';
    const rows = (inv.lines || [])
      .filter((l) => l.item || l.qty)
      .map((l, i) => {
        const c = lineCalc(l, inv.priceWithTax);
        return `<tr>
          <td>${i + 1}</td>
          <td>${piEsc(l.item)}${l.hsn ? `<div style="color:#667787;font-size:11px">HSN ${piEsc(l.hsn)}</div>` : ''}</td>
          <td class="num">${c.qty || ''}</td>
          <td>${piEsc(l.unit || unit)}</td>
          <td class="num">${l.price ? piMoney(l.price) : ''}</td>
          <td class="num">${c.taxAmt ? piMoney(c.taxAmt) : '—'}</td>
          <td class="num">${piMoney(c.amount)}</td>
        </tr>`;
      })
      .join('');
    const exportBits =
      inv.type === 'export'
        ? `<p>Buyer’s order: ${piEsc(inv.orderNo || '—')} ${inv.orderDate ? ' · ' + inv.orderDate : ''}<br/>
           F.O.B. ${piEsc(inv.fob || '—')} · IE ${piEsc(inv.ieCode || co.ieCode)} · ${piEsc(inv.currency || 'INR')}<br/>
           ${inv.paymentTerms ? 'Terms: ' + piEsc(inv.paymentTerms) : ''}</p>`
        : '';
    const gstRows = t.intra
      ? `<tr><td colspan="6">CGST</td><td class="num">${piMoney(t.cgst)}</td></tr>
         <tr><td colspan="6">SGST</td><td class="num">${piMoney(t.sgst)}</td></tr>`
      : `<tr><td colspan="6">IGST</td><td class="num">${piMoney(t.igst)}</td></tr>`;
    printReport(
      `Proforma Invoice ${inv.refNo}`,
      `<div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:16px">
        <div>
          <strong>${piEsc(co.name)}</strong><br/>
          ${piEsc(co.address)}<br/>
          GSTIN ${piEsc(co.gstin)} · IE ${piEsc(co.ieCode)}
        </div>
        <div style="text-align:right">
          <div style="font-size:1.1rem;font-weight:700">PROFORMA INVOICE</div>
          Ref PI/${fy}/${piEsc(inv.refNo)}<br/>
          Date ${inv.date}<br/>
          ${piTypeLabel(inv.type)} · ${activeQuarry().name}
        </div>
      </div>
      <p><strong>M/s. ${piEsc(party?.name || '—')}</strong><br/>
      ${party?.billing || party?.shipping || ''}<br/>
      ${party?.gstin && party.gstin !== '—' ? 'GSTIN ' + piEsc(party.gstin) : ''}
      ${inv.stateOfSupply ? ' · State of supply: ' + piEsc(inv.stateOfSupply) : ''}</p>
      ${exportBits}
      ${inv.description ? `<pre style="font:inherit;white-space:pre-wrap">${piEsc(inv.description)}</pre>` : ''}
      ${inv.imageData ? `<p><img src="${inv.imageData}" style="max-width:280px;max-height:160px" alt="" /></p>` : ''}
      <table>
        <thead><tr><th>#</th><th>Particulars</th><th class="num">Qty</th><th>Unit</th><th class="num">Rate</th><th class="num">Tax</th><th class="num">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          ${gstRows}
          ${inv.roundOff ? `<tr><td colspan="6">Round off</td><td class="num">${piMoney(t.roundAmt)}</td></tr>` : ''}
          <tr><th colspan="6">Total</th><th class="num">${piMoney(t.total)}</th></tr>
        </tfoot>
      </table>
      ${inv.terms ? `<p style="margin-top:14px"><strong>Terms &amp; conditions</strong><br/><pre style="font:inherit;white-space:pre-wrap">${piEsc(inv.terms)}</pre></p>` : ''}
      <p style="margin-top:18px;font-size:.85rem">Bank: ${piEsc(bankLine() || co.banks)}<br/>For ${piEsc(co.name)}</p>`
    );
  }

  function exportPiExcel(inv) {
    const party = state.parties.find((p) => p.id === inv.partyId);
    const t = invoiceTotals(inv);
    const rows = [
      ['Proforma Invoice', inv.refNo, inv.date, piTypeLabel(inv.type)],
      ['Party', party?.name || ''],
      ['State of supply', inv.stateOfSupply || ''],
      [],
      ['#', 'Item', 'Qty', 'Unit', 'Rate', 'Discount', 'Tax', 'Amount'],
      ...(inv.lines || [])
        .filter((l) => l.item || l.qty)
        .map((l, i) => {
          const c = lineCalc(l, inv.priceWithTax);
          return [i + 1, l.item, c.qty, l.unit, l.price, c.discAmt, c.taxAmt, c.amount];
        }),
      [],
      ['', '', t.qty, '', '', t.disc, t.tax, t.total],
    ];
    downloadCsv(`PI-${inv.refNo || 'draft'}.csv`, rows);
    toast('Invoice exported');
  }

  function renderPiEditor() {
    if (!selectedPiId) return;
    if (
      piDraft &&
      piDraft.id !== 'new' &&
      piDraft.quarryId &&
      piDraft.quarryId !== state.activeQuarryId
    ) {
      go('invoices');
      return;
    }
    if (!piDraft || String(piDraft.id) !== String(selectedPiId)) {
      loadPiDraft(selectedPiId);
      piMountedId = null;
    }
    const root = $('#piEditorRoot');
    if (!root) return;
    if (piMountedId === selectedPiId && root.querySelector('.pi-editor')) {
      paintPiCalcs();
      return;
    }
    root.innerHTML = piEditorHtml();
    bindPiEditor();
    paintPiCalcs();
    piMountedId = selectedPiId;
  }

  function renderInvoices() {
    const q = ($('#invoiceSearch')?.value || '').toLowerCase();
    const typeF = $('#invoiceTypeFilter')?.value || 'all';
    const sort = $('#invoiceSort')?.value || 'date-desc';
    let list = quarryInvoices().map((inv) => {
      const party = state.parties.find((p) => p.id === inv.partyId);
      const t = invoiceTotals(inv);
      return { inv, party, t };
    });
    if (typeF !== 'all') list = list.filter((x) => x.inv.type === typeF);
    if (q) {
      list = list.filter((x) =>
        `${x.inv.refNo} ${x.party?.name || ''} ${x.inv.lines?.map((l) => l.item).join(' ')}`
          .toLowerCase()
          .includes(q)
      );
    }
    list.sort((a, b) => {
      if (sort === 'date-asc') return (a.inv.date || '').localeCompare(b.inv.date || '');
      if (sort === 'amt-desc') return b.t.total - a.t.total;
      if (sort === 'party') return (a.party?.name || '').localeCompare(b.party?.name || '');
      return (b.inv.date || '').localeCompare(a.inv.date || '');
    });
    const tot = list.reduce((s, x) => s + x.t.total, 0);
    if ($('#invoiceStats')) {
      $('#invoiceStats').innerHTML = `
        <div class="card"><h3>Invoices</h3><div class="stat">${list.length}</div><div class="hint">This quarry</div></div>
        <div class="card"><h3>Value</h3><div class="stat ok">${money(tot)}</div><div class="hint">Incl. tax / round off</div></div>
        <div class="card"><h3>Block</h3><div class="stat">${list.filter((x) => x.inv.type === 'block').length}</div></div>
        <div class="card"><h3>Slab / Export</h3><div class="stat">${list.filter((x) => x.inv.type !== 'block').length}</div></div>`;
    }
    const page = slicePage(list, 'invoices', '#invoicePageSize');
    if ($('#invoiceTable')) {
      $('#invoiceTable').innerHTML = page.rows.length
        ? page.rows
            .map(
              ({ inv, party, t }) => `<tr>
                <td>${inv.date || '—'}</td>
                <td>PI/${fyFromDate(inv.date) || '—'} / ${inv.refNo}</td>
                <td><strong>${party?.name || '—'}</strong></td>
                <td>${piTypeLabel(inv.type)}</td>
                <td class="num">${t.qty ? Number(t.qty.toFixed(3)) : '—'}</td>
                <td class="num">${money(t.tax)}</td>
                <td class="num">${money(t.total)}</td>
                <td>
                  <button type="button" class="btn btn-ghost btn-sm" data-piedit="${inv.id}">Edit</button>
                  <button type="button" class="btn btn-ghost btn-sm" data-piprint="${inv.id}">PDF</button>
                  <button type="button" class="btn btn-ghost btn-sm" data-pidel="${inv.id}">Delete</button>
                </td>
              </tr>`
            )
            .join('')
        : `<tr><td colspan="8"><div class="empty">No proforma invoices — create one like Vyapar</div></td></tr>`;
      $$('#invoiceTable [data-piedit]').forEach((b) =>
        b.addEventListener('click', () => go('pieditor', { piId: b.dataset.piedit }))
      );
      $$('#invoiceTable [data-piprint]').forEach((b) =>
        b.addEventListener('click', () => {
          const inv = state.invoices.find((i) => i.id === b.dataset.piprint);
          if (inv) printPi(inv);
        })
      );
      $$('#invoiceTable [data-pidel]').forEach((b) =>
        b.addEventListener('click', () => {
          if (!confirm('Delete this proforma invoice?')) return;
          state.invoices = (state.invoices || []).filter((i) => i.id !== b.dataset.pidel);
          save(state);
          toast('Invoice deleted');
          renderInvoices();
        })
      );
    }
    renderPager($('#invoicePager'), 'invoices', page, renderInvoices);
  }

  $('#addInvoiceBtn')?.addEventListener('click', () => {
    piDraft = newPiDraft();
    piMountedId = null;
    go('pieditor', { piId: 'new' });
  });
  $('#exportInvoicesBtn')?.addEventListener('click', () => {
    const rows = [
      ['Date', 'Ref', 'Party', 'Type', 'Qty', 'Tax', 'Total'],
      ...quarryInvoices().map((inv) => {
        const party = state.parties.find((p) => p.id === inv.partyId);
        const t = invoiceTotals(inv);
        return [inv.date, inv.refNo, party?.name || '', piTypeLabel(inv.type), t.qty, t.tax, t.total];
      }),
    ];
    downloadCsv('proforma-invoices.csv', rows);
    toast('Invoice list exported');
  });
  ['#invoiceSearch', '#invoiceTypeFilter', '#invoiceSort', '#invoicePageSize'].forEach((sel) => {
    $(sel)?.addEventListener(sel.includes('Search') ? 'input' : 'change', () => {
      tableUI.invoices.page = 1;
      renderInvoices();
    });
  });
  document.addEventListener('click', () => $('#piShareWrap')?.classList.remove('open'));

  function render() {
    applyAccess();
    renderSwitcher();
    const activePage = $('.page.active')?.id?.replace('page-', '') || 'dashboard';
    if (activePage === 'dashboard') renderDashboard();
    if (activePage === 'expenses') renderExpenses();
    if (activePage === 'sale') renderSale();
    if (activePage === 'saledetail') renderSaleDetail();
    if (activePage === 'purchase') renderPurchase();
    if (activePage === 'finance') renderFinance();
    if (activePage === 'gift') renderGifts();
    if (activePage === 'loandetail') renderLoanDetail();
    if (activePage === 'payroll') renderPayroll();
    if (activePage === 'staffmgmt') renderStaffMgmt();
    if (activePage === 'staffdetail') renderStaffDetail();
    if (activePage === 'gangdetail') renderGangDetail();
    if (activePage === 'staffatt') renderStaffAtt();
    if (activePage === 'staffsal') renderStaffSalary();
    if (activePage === 'sales') renderSales();
    if (activePage === 'invoices') renderInvoices();
    if (activePage === 'pieditor') renderPiEditor();
    if (activePage === 'customers') renderCustomers();
    if (activePage === 'customerdetail') renderCustomerDetail();
    if (activePage === 'vendors') renderVendors();
    if (activePage === 'vendordetail') renderVendorDetail();
    if (activePage === 'royalty') renderRoyalty();
    if (activePage === 'machinery') renderMachinery();
    if (activePage === 'masters') renderMasters();
    if (activePage === 'users') renderUsers();
    if (activePage === 'reports') renderReports();
  }

  if (!(location.hash || '').replace(/^#/, '')) {
    history.replaceState(null, '', '#dashboard');
  }
  $('#loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('#loginErr');
    if (err) {
      err.hidden = true;
      err.textContent = '';
    }
    const ok = signIn($('#loginUser')?.value, $('#loginPass')?.value);
    if (!ok) {
      if (err) {
        err.hidden = false;
        err.textContent = 'Wrong username or password';
      }
    }
  });
  $$('.login-demo-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const user = btn.dataset.user || '';
      const pass = btn.dataset.pass || '';
      if ($('#loginUser')) $('#loginUser').value = user;
      if ($('#loginPass')) $('#loginPass').value = pass;
      const err = $('#loginErr');
      if (err) {
        err.hidden = true;
        err.textContent = '';
      }
      const ok = signIn(user, pass);
      if (!ok) {
        if (err) {
          err.hidden = false;
          err.textContent = 'Wrong username or password';
        }
      }
    });
  });
  $('#userChipBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = $('#userMenu');
    const open = menu?.classList.contains('open');
    closeSwitchers();
    if (!open) menu?.classList.add('open');
  });
  $('#signOutBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    signOut();
  });
  $('#userMenuDrop')?.addEventListener('click', (e) => e.stopPropagation());
  if (currentUser()) {
    hideLogin();
    applyAccess();
    applyRoute();
  } else {
    showLogin();
  }
})();

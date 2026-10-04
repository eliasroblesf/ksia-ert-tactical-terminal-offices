export interface Scenario {
  id: string;
  name: string;
  location: string;
  buildingType: string;
  floorLevel: string;
  description: string;
  initialHazards: string[];
  initialCasualties: string;
  paxCount: number;
  cascadingInjects: {
    time: number;
    title: string;
    description: string;
    type: 'RADIO' | 'SYSTEM' | 'SECURITY' | 'ENVIRONMENT';
  }[];
}

export const scenarios: Scenario[] = [
  {
    id: 'group1',
    name: 'Executive Directorate & Boardroom Complex',
    location: 'KSIA HQ Tower 1, Level 4 (Executive Suites & Boardroom)',
    buildingType: 'Corporate Administration Headquarters',
    floorLevel: 'Level 4 - Executive Wing',
    description: 'Overheated lithium battery in the executive conference AV rack suffered thermal runaway, igniting soundproof acoustic wall fabric. Toxic cyanide smoke rapidly migrating through executive boardroom and executive assistant cubicles. Managing Director collapsed with acute smoke inhalation.',
    initialHazards: [
      'Acoustic Fabric Toxic Fumes (HCN/CO)',
      'Energized 48V AV Rack Batteries',
      'Electronic Magnetic Door Lockout'
    ],
    initialCasualties: '1 Board Executive (Severe Smoke Inhalation, Unconscious, Agonal Gasps)',
    paxCount: 45,
    cascadingInjects: [
      {
        time: 180,
        title: 'Stairwell B Smoke Contamination',
        description: 'Pressurization fan failed on Stairwell B; toxic office smoke entering primary evacuation stairwell.',
        type: 'SYSTEM'
      },
      {
        time: 360,
        title: 'Executive Access Turnstile Lockout',
        description: 'Electronic access control fail-secure malfunction locked Level 4 glass barrier turnstiles.',
        type: 'SECURITY'
      },
      {
        time: 600,
        title: 'Confidential Records Re-entry Attempt',
        description: 'Corporate legal counsel attempting dangerous re-entry into smoky office to recover encrypted laptops.',
        type: 'SECURITY'
      }
    ]
  },
  {
    id: 'group2',
    name: 'Airport Pass & Security Credentialing Office',
    location: 'Airport Administration Center, Ground Floor West (ID Badging & Permitting)',
    buildingType: 'High-Volume Administrative & Public Access Complex',
    floorLevel: 'Ground Floor - Pass Office & Reception',
    description: 'Electrical transformer capacitor in the high-density ID printing room ruptured, spraying burning dielectric fluid onto cardboard archive boxes. Panicked contractor queue rushed the narrow badging vestibule, causing a stampede crush against magnetic security gates.',
    initialHazards: [
      'Burning Dielectric Oil & Class C Electrical Fire',
      'Narrow Egress Bottleneck & High Crowd Density',
      'Toxic Fumes from Plastic Card Laminators'
    ],
    initialCasualties: '1 Badge Applicant (Compound Tibia Fracture, Lower Extremity Arterial Hemorrhage)',
    paxCount: 85,
    cascadingInjects: [
      {
        time: 180,
        title: 'Public Turnstile Jam',
        description: 'Crowd surge deformed turnstile rotor arms; egress flow choked down to single file.',
        type: 'SECURITY'
      },
      {
        time: 420,
        title: 'Aerosol PVC Toxic Migration',
        description: 'Vaporized laminating resins migrating into public waiting room; severe coughing reported.',
        type: 'ENVIRONMENT'
      },
      {
        time: 660,
        title: 'Secure File Vault Personnel Trapped',
        description: 'Two badging clerks trapped inside fire-rated document vault due to magnetic solenoid jam.',
        type: 'SYSTEM'
      }
    ]
  },
  {
    id: 'group3',
    name: 'Airline Corporate & Flight Dispatch Offices',
    location: 'Operations Management Building, Level 2 (Flight Dispatch & Operations Centre)',
    buildingType: 'Operational Support Administrative Suites',
    floorLevel: 'Level 2 - Dispatch & Crew Scheduling Suites',
    description: 'Commercial microwave capacitor flash-fire in the open-plan employee kitchenette ignited upper overhead cabinets and ceiling acoustic tiles. Dense black smoke flooded the 24/7 flight dispatch floor. Dispatch Supervisor collapsed at console while issuing diversion notices.',
    initialHazards: [
      'Kitchenette Cabinetry Flash Fire',
      'Suspended Ceiling Tile Ingress',
      'Zero-Visibility in Partitioned Workstation Bays'
    ],
    initialCasualties: '1 Flight Dispatch Supervisor (Severe Inhalation Burns, Cyanotic, Pulse Weak)',
    paxCount: 60,
    cascadingInjects: [
      {
        time: 180,
        title: 'Structural Radio Blindspot',
        description: 'Dense structural concrete office core and IT server shielding degrading portable radio RF signals.',
        type: 'RADIO'
      },
      {
        time: 360,
        title: 'HVAC Recirculation Failure',
        description: 'Return air dampers stuck 100% open, venting kitchen smoke into Level 3 Executive HR offices.',
        type: 'ENVIRONMENT'
      },
      {
        time: 540,
        title: 'Soundproof Pod Trapped Personnel',
        description: 'Two crew schedulers wearing noise-canceling headsets trapped inside soundproof meeting booths.',
        type: 'SECURITY'
      }
    ]
  },
  {
    id: 'group4',
    name: 'Airport Engineering & Architecture Headquarters',
    location: 'KSIA Engineering Complex, Level 3 (Design Labs & Project Archives)',
    buildingType: 'Technical Administrative & Engineering Directorate',
    floorLevel: 'Level 3 - Engineering & Architectural Directorate',
    description: 'Flammable cleaning solvent in the architectural plotting room ignited by an electric drying heat press. Large format blueprint paper rolls fueled a rapid flashover. Senior Architect sustained third-degree burns and blast concussive disorientation.',
    initialHazards: [
      'High-Load Paper Archive Fuel Source',
      'Combustible Plotter Solvent Vapors',
      'Broken Tempered Glass Office Dividers'
    ],
    initialCasualties: '1 Senior Architect (30% Partial-Thickness Flash Burns & Compromised Airway)',
    paxCount: 50,
    cascadingInjects: [
      {
        time: 180,
        title: 'Archive Rolling Stacks Blockage',
        description: 'Motorized high-density blueprint archive tracks lost power, obstructing East Corridor exit door.',
        type: 'SYSTEM'
      },
      {
        time: 360,
        title: 'Emergency Lighting Circuit Tripped',
        description: 'Water deluge shorted primary emergency inverter; Level 3 central corridor plunged into total blackout.',
        type: 'SYSTEM'
      },
      {
        time: 600,
        title: 'Floor Penetration Solvent Infiltration',
        description: 'Flammable liquid chemical runoff leaking through cable sleeve into Level 2 Accounting office below.',
        type: 'ENVIRONMENT'
      }
    ]
  },
  {
    id: 'group5',
    name: 'Finance, Legal & Human Resources Administration',
    location: 'Corporate Directorate Block B, Level 5 (HR, Legal & Auditing Suites)',
    buildingType: 'Multi-Department Corporate Office Tower',
    floorLevel: 'Level 5 - Human Resources & Legal Affairs',
    description: 'Catastrophic pressure vessel rupture of unvented hot water boiler in staff breakroom blew out drywall partitions and collapsed heavy suspended acoustic ceiling grids. HR Compliance Officer pinned under heavy structural ceiling grid with suspected severe pelvic trauma.',
    initialHazards: [
      'Heavy Suspended Metal Ceiling Grid Collapse',
      'Live Exposed 240V Wiring in Dropped Ceiling',
      'High-Pressure Scalding Water & Wet Debris'
    ],
    initialCasualties: '1 HR Officer (Crush Syndrome, Severe Pelvic Fracture, Rapid Decompensation)',
    paxCount: 70,
    cascadingInjects: [
      {
        time: 180,
        title: 'Electrical Sub-Station Flooding',
        description: 'Water cascading down drywall onto Level 5 electrical busway, threatening building-wide power trip.',
        type: 'SYSTEM'
      },
      {
        time: 420,
        title: 'Exit Stairwell Door Jam',
        description: 'Collapsed drywall partition wedged against Stairwell North door, preventing outward swing.',
        type: 'SECURITY'
      },
      {
        time: 660,
        title: 'Stranded Mobility-Impaired Employee',
        description: 'Wheelchair-using auditor stranded in quiet interview room; evacuation chair required immediately.',
        type: 'SECURITY'
      }
    ]
  }
];

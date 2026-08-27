/**
 * Fictional HR policies for the COIT20254 academic demonstration.
 *
 * These documents describe a fictional organisation ("Northbridge Services Group")
 * and were written for this capstone. They are NOT copied from, and do not
 * represent, any real organisation's proprietary HR documentation.
 */

export interface PolicySection {
  heading: string;
  paragraphs: string[];
}

export interface PolicySpec {
  fileName: string;
  title: string;
  category: string;
  version: string;
  summary: string;
  requiresAcknowledgement: boolean;
  sections: PolicySection[];
}

export const ORGANISATION = 'Northbridge Services Group';

export const POLICIES: PolicySpec[] = [
  {
    fileName: 'employee-leave-policy.pdf',
    title: 'Employee Leave Policy',
    category: 'Leave & Entitlements',
    version: '4.2',
    summary:
      'Annual leave, personal leave, carer’s leave, long service leave and the process for requesting leave.',
    requiresAcknowledgement: false,
    sections: [
      {
        heading: '1. Purpose and Scope',
        paragraphs: [
          `This policy sets out the leave entitlements available to employees of ${ORGANISATION} and the process for requesting and approving leave. It applies to all permanent full-time, permanent part-time and fixed-term employees. Casual employees are covered only by the provisions expressly stated as applying to casual staff.`,
          'This policy should be read together with the Workplace Flexibility Policy and the Remote Work Policy. Where this policy is silent on a matter, employees should contact the People and Culture team for guidance.',
        ],
      },
      {
        heading: '2. Definitions',
        paragraphs: [
          'A "day" of leave means an ordinary working day for the employee concerned. For part-time employees, leave accrues and is deducted on a pro rata basis calculated against ordinary hours worked.',
          'The "leave year" runs from 1 July to 30 June. "Continuous service" means unbroken service with the organisation, excluding periods of unpaid leave longer than four weeks.',
        ],
      },
      {
        heading: '3. Annual Leave Entitlements',
        paragraphs: [
          'Permanent full-time employees are entitled to 20 days of paid annual leave for each completed year of continuous service. Annual leave accrues progressively throughout the leave year at the rate of 1.667 days per completed month of service and accumulates from year to year.',
          'Permanent part-time employees are entitled to annual leave on a pro rata basis, calculated according to their ordinary weekly hours. Casual employees do not accrue paid annual leave.',
          'Employees engaged in continuous shift work are entitled to an additional 5 days of paid annual leave each year, giving a total of 25 days of annual leave for each completed year of continuous service.',
          'Employees may accumulate a maximum of 40 days of annual leave. Where an employee has accrued more than 40 days, the People and Culture team will contact the employee and their manager to agree a plan to reduce the balance within six months.',
        ],
      },
      {
        heading: '4. Requesting Annual Leave',
        paragraphs: [
          'Employees must submit a leave request through the self-service system at least 14 calendar days before the intended start date for absences of five days or fewer, and at least 28 calendar days before the start date for absences longer than five days.',
          'Managers must respond to a leave request within 5 business days of submission. Approval will not be unreasonably withheld, but the organisation may decline a request where the absence would create an unreasonable operational impact during a peak business period.',
          'Where a request is declined, the manager must give the employee written reasons and work with the employee to identify alternative dates.',
        ],
      },
      {
        heading: '5. Personal and Carer’s Leave',
        paragraphs: [
          'Permanent employees are entitled to 10 days of paid personal leave for each year of continuous service. Personal leave may be taken because the employee is unfit for work due to personal illness or injury, or to provide care or support to a member of the employee’s immediate family or household.',
          'Unused personal leave accumulates from year to year. Personal leave is not paid out on termination of employment.',
          'An employee must notify their manager as soon as reasonably practicable, and in any case before the start of the working day where possible. A medical certificate or statutory declaration is required for any absence of more than two consecutive days, and for any absence adjoining a public holiday.',
          'Casual employees are entitled to 2 days of unpaid carer’s leave per occasion.',
        ],
      },
      {
        heading: '6. Compassionate and Bereavement Leave',
        paragraphs: [
          'Employees are entitled to 3 days of paid compassionate leave per occasion when a member of their immediate family or household dies, or contracts or develops a life-threatening illness or injury.',
          'Additional unpaid leave may be approved by the relevant manager in consultation with the People and Culture team.',
        ],
      },
      {
        heading: '7. Long Service Leave',
        paragraphs: [
          'Employees who complete 7 years of continuous service are entitled to 6.5 weeks of paid long service leave. A further 1.3 weeks accrues for each additional completed year of continuous service.',
          'Long service leave must be taken at a time agreed between the employee and the organisation, with at least 60 days written notice.',
        ],
      },
      {
        heading: '8. Unpaid Leave',
        paragraphs: [
          'Employees may apply for unpaid leave where paid leave entitlements have been exhausted. Applications for unpaid leave longer than four weeks require approval from the relevant Head of Department and the People and Culture team.',
          'Periods of unpaid leave longer than four weeks do not count as continuous service for the purpose of accruing annual leave, personal leave or long service leave.',
        ],
      },
      {
        heading: '9. Leave During Notice Periods',
        paragraphs: [
          'Annual leave will not ordinarily be approved during a notice period unless agreed in writing by the relevant manager. Accrued but untaken annual leave is paid out on termination of employment at the employee’s base rate of pay.',
        ],
      },
      {
        heading: '10. Policy Review',
        paragraphs: [
          'This policy is reviewed every 24 months by the People and Culture team, or earlier where legislative change requires it. Questions about this policy should be directed to the People and Culture team.',
        ],
      },
    ],
  },
  {
    fileName: 'workplace-flexibility-policy.pdf',
    title: 'Workplace Flexibility Policy',
    category: 'Flexible Work',
    version: '2.3',
    summary:
      'Flexible work arrangements, eligibility, the request process and how requests are assessed.',
    requiresAcknowledgement: false,
    sections: [
      {
        heading: '1. Purpose',
        paragraphs: [
          `${ORGANISATION} recognises that flexible work arrangements support employee wellbeing, participation and retention. This policy explains what flexible work arrangements are available and the process for requesting flexible work.`,
        ],
      },
      {
        heading: '2. Types of Flexible Work Arrangements',
        paragraphs: [
          'Flexible work arrangements available under this policy include changes to start and finish times, compressed working weeks, part-time work, job sharing, purchased additional leave, and working from a remote location.',
          'Arrangements involving work from a location other than an organisational office are also subject to the Remote Work Policy.',
        ],
      },
      {
        heading: '3. Eligibility',
        paragraphs: [
          'All permanent employees who have completed 6 months of continuous service may request a flexible work arrangement. Employees with less than 6 months service may request a temporary arrangement, which is assessed on a case-by-case basis.',
          'Employees who are a parent of a school-age child, a carer, aged 55 or over, living with a disability, or experiencing family and domestic violence may request a flexible work arrangement at any time, regardless of length of service.',
        ],
      },
      {
        heading: '4. The Process for Requesting Flexible Work',
        paragraphs: [
          'The process for requesting flexible work has four steps. First, the employee discusses the proposed arrangement informally with their manager. Second, the employee submits a written request through the self-service system stating the change sought, the proposed start date, whether the arrangement is temporary or ongoing, and how the employee proposes to manage their responsibilities under the arrangement.',
          'Third, the manager must meet with the employee to discuss the request within 10 business days of receiving it. Fourth, the manager must provide a written response within 21 days of receiving the request, stating whether the request is approved, approved with modification, or declined.',
          'Where a request is declined, the written response must set out the business grounds for the decision and any alternative arrangements the organisation is willing to offer.',
        ],
      },
      {
        heading: '5. Assessing a Request',
        paragraphs: [
          'Managers must genuinely consider each request. A request may only be declined on reasonable business grounds, which include excessive cost, a substantial loss of efficiency or productivity, an inability to reorganise work among existing staff, an inability to recruit replacement staff, or a significant negative impact on customer service.',
          'A manager must not decline a request because of personal preference or because flexible work has not previously been offered in that team.',
        ],
      },
      {
        heading: '6. Review of Arrangements',
        paragraphs: [
          'Approved flexible work arrangements are reviewed every 12 months, or earlier if either party requests a review. Either the employee or the organisation may seek to vary or end an arrangement by giving 4 weeks written notice.',
        ],
      },
      {
        heading: '7. Disputes',
        paragraphs: [
          'An employee who is dissatisfied with a decision about a flexible work request may raise the matter with the People and Culture team. Unresolved matters are handled under the organisation’s dispute resolution procedure.',
        ],
      },
    ],
  },
  {
    fileName: 'remote-work-policy.pdf',
    title: 'Remote Work Policy',
    category: 'Flexible Work',
    version: '3.0',
    summary:
      'Requirements for working remotely, including eligibility, workspace, equipment, security and availability.',
    requiresAcknowledgement: true,
    sections: [
      {
        heading: '1. Purpose and Application',
        paragraphs: [
          'This policy sets out the requirements for remote work and applies to any employee who performs duties from a location other than an organisational office for one or more days per week.',
        ],
      },
      {
        heading: '2. Eligibility for Remote Work',
        paragraphs: [
          'Remote work is available to employees whose duties can be performed effectively away from an organisational office. Roles requiring on-site presence, physical handling of records, or in-person client service are not eligible.',
          'Employees must have completed 3 months of continuous service and must not be subject to an active performance improvement plan.',
          'Remote work arrangements are approved for a maximum of 3 days per week unless an exception is approved by the relevant Head of Department.',
        ],
      },
      {
        heading: '3. Requirements for the Remote Workspace',
        paragraphs: [
          'The requirements for remote work include a safe and suitable workspace. Employees must complete the remote workspace self-assessment checklist before the arrangement begins and again every 12 months.',
          'The workspace must have adequate lighting and ventilation, a stable work surface and a supportive chair, safe electrical fittings, and be free of trip hazards. Employees must report any workplace injury sustained while working remotely to their manager on the day it occurs.',
        ],
      },
      {
        heading: '4. Equipment and Expenses',
        paragraphs: [
          'The organisation supplies a laptop and, on request, a monitor, keyboard and mouse for remote work. Employees are responsible for providing a reliable internet connection with a minimum sustained download speed of 25 Mbps.',
          'The organisation does not reimburse household costs such as electricity, heating or internet access unless a specific written agreement states otherwise.',
        ],
      },
      {
        heading: '5. Information Security Requirements',
        paragraphs: [
          'Employees working remotely must comply with the Information Security Policy at all times. Organisational data must not be stored on personal devices, and work must not be performed on shared or public computers.',
          'Employees must use the organisational virtual private network when accessing internal systems, must not use public wireless networks without the VPN, and must lock devices whenever they are unattended.',
          'Confidential conversations must be conducted where they cannot be overheard by members of the household or the public.',
        ],
      },
      {
        heading: '6. Availability and Communication',
        paragraphs: [
          'Employees working remotely must be contactable during their agreed ordinary hours, must attend scheduled meetings by video where requested, and must update their calendar and status to reflect their availability.',
          'Remote work is not a substitute for carer arrangements. Employees with caring responsibilities during working hours should discuss a flexible work arrangement under the Workplace Flexibility Policy.',
        ],
      },
      {
        heading: '7. Ending a Remote Work Arrangement',
        paragraphs: [
          'The organisation may end a remote work arrangement by giving 4 weeks written notice where the arrangement is no longer meeting operational requirements or where the employee has not met the requirements of this policy.',
        ],
      },
    ],
  },
  {
    fileName: 'information-security-policy.pdf',
    title: 'Information Security Policy',
    category: 'Security & Compliance',
    version: '2.4',
    summary:
      'Acceptable use, passwords, data classification, incident reporting and mandatory acknowledgement requirements.',
    requiresAcknowledgement: true,
    sections: [
      {
        heading: '1. Purpose',
        paragraphs: [
          `This policy protects the confidentiality, integrity and availability of information held by ${ORGANISATION}. It applies to all employees, contractors and third parties who access organisational systems or data.`,
        ],
      },
      {
        heading: '2. Policy Acknowledgement Requirement',
        paragraphs: [
          'All employees are required to read and acknowledge this Information Security Policy. Acknowledgement is mandatory and must be completed within 14 days of commencing employment, and again within 14 days of each new version being published.',
          'Employees acknowledge the policy through the self-service system. The organisation records the date and time of each acknowledgement for audit and compliance purposes. Failure to acknowledge a required policy is escalated to the employee’s manager.',
        ],
      },
      {
        heading: '3. Data Classification',
        paragraphs: [
          'Information is classified as Public, Internal, Confidential or Restricted. Confidential information includes employee personal information, payroll data and client records. Restricted information includes authentication credentials, security configurations and information subject to a legal hold.',
          'Confidential and Restricted information must not be transmitted by personal email, personal messaging applications, or unapproved cloud storage services.',
        ],
      },
      {
        heading: '4. Passwords and Authentication',
        paragraphs: [
          'Passwords must be at least 14 characters. Passwords must not be reused across organisational and personal accounts and must not be shared with any other person, including managers and IT staff.',
          'Multi-factor authentication is mandatory for email, the virtual private network, and any system holding Confidential or Restricted information. Employees must not approve a multi-factor prompt they did not initiate.',
        ],
      },
      {
        heading: '5. Acceptable Use',
        paragraphs: [
          'Organisational devices and accounts are provided for business purposes. Limited, reasonable personal use is permitted provided it does not interfere with work, consume significant resources, or breach any organisational policy.',
          'Employees must not install unapproved software, disable security controls, or connect unapproved storage devices to organisational equipment.',
        ],
      },
      {
        heading: '6. Reporting Security Incidents',
        paragraphs: [
          'Employees must report suspected security incidents to the IT Service Desk immediately, and in any case within 1 hour of becoming aware of the incident. Reportable incidents include lost or stolen devices, suspected phishing, accidental disclosure of Confidential information, and any suspected unauthorised access.',
          'Employees will not be penalised for reporting an incident in good faith, including where the employee contributed to the incident.',
        ],
      },
      {
        heading: '7. Consequences of Breach',
        paragraphs: [
          'A breach of this policy may result in disciplinary action under the Workplace Conduct Policy, up to and including termination of employment, and may be referred to law enforcement where the breach involves suspected criminal conduct.',
        ],
      },
    ],
  },
  {
    fileName: 'workplace-conduct-policy.pdf',
    title: 'Workplace Conduct Policy',
    category: 'Conduct & Behaviour',
    version: '3.1',
    summary:
      'Expected standards of behaviour, bullying and harassment, complaints handling and disciplinary process.',
    requiresAcknowledgement: true,
    sections: [
      {
        heading: '1. Purpose and Commitment',
        paragraphs: [
          `${ORGANISATION} is committed to a safe and respectful workplace free from bullying, harassment and discrimination. This policy sets out expected standards of behaviour and the process for raising concerns.`,
        ],
      },
      {
        heading: '2. Expected Standards of Behaviour',
        paragraphs: [
          'Employees are expected to treat colleagues, clients and members of the public with courtesy and respect, to perform their duties competently and safely, to follow lawful and reasonable directions, and to declare any conflict of interest.',
          'Employees must not attend work under the influence of alcohol or unlawful drugs, and must not misuse organisational property or funds.',
        ],
      },
      {
        heading: '3. Bullying, Harassment and Discrimination',
        paragraphs: [
          'Workplace bullying is repeated and unreasonable behaviour directed towards a worker that creates a risk to health and safety. Reasonable management action carried out in a reasonable manner, including performance management and allocation of work, is not bullying.',
          'Sexual harassment is any unwelcome conduct of a sexual nature that a reasonable person would anticipate could make another person feel offended, humiliated or intimidated. Sexual harassment is unlawful and will not be tolerated.',
          'Discrimination on the basis of a protected attribute, including age, disability, race, sex, gender identity, sexual orientation, pregnancy, carer responsibilities, religion or political opinion, is prohibited.',
        ],
      },
      {
        heading: '4. Raising a Complaint',
        paragraphs: [
          'An employee who experiences or witnesses conduct that breaches this policy may raise the matter informally with their manager, or make a formal written complaint to the People and Culture team.',
          'The organisation will acknowledge a formal complaint within 3 business days and will aim to complete its enquiries within 20 business days. Complainants and respondents will be kept informed of progress.',
        ],
      },
      {
        heading: '5. Investigation and Procedural Fairness',
        paragraphs: [
          'Investigations are conducted impartially and confidentially. A person against whom an allegation is made will be told the substance of the allegation and given a reasonable opportunity to respond before any finding is made.',
          'Employees may bring a support person to any investigation meeting. Victimisation of a person who makes a complaint in good faith, or who participates in an investigation, is itself a breach of this policy.',
        ],
      },
      {
        heading: '6. Disciplinary Action',
        paragraphs: [
          'Where a breach is substantiated, the organisation may take disciplinary action proportionate to the seriousness of the conduct, including counselling, a formal warning, a final written warning, demotion, or termination of employment.',
          'Serious misconduct, including violence, theft, fraud, serious breach of the Information Security Policy, or sexual harassment, may result in summary dismissal.',
        ],
      },
    ],
  },
  {
    fileName: 'employee-code-of-conduct.pdf',
    title: 'Employee Code of Conduct',
    category: 'Conduct & Behaviour',
    version: '1.8',
    summary:
      'Ethical principles, conflicts of interest, gifts, confidentiality, public comment and reporting wrongdoing.',
    requiresAcknowledgement: false,
    sections: [
      {
        heading: '1. Our Ethical Principles',
        paragraphs: [
          `This Code of Conduct describes how employees of ${ORGANISATION} are expected to act. The organisation’s ethical principles are integrity, accountability, respect, and service to clients and the community.`,
        ],
      },
      {
        heading: '2. Conflicts of Interest',
        paragraphs: [
          'A conflict of interest arises where an employee’s private interests could improperly influence the performance of their duties. Employees must declare any actual, potential or perceived conflict of interest to their manager in writing as soon as they become aware of it.',
          'Employees must not participate in a recruitment, procurement or approval decision involving a relative, close friend, or an organisation in which they hold a financial interest.',
        ],
      },
      {
        heading: '3. Gifts, Benefits and Hospitality',
        paragraphs: [
          'Employees must not solicit gifts or benefits. A gift or benefit with an estimated value over $100 must be declined, or if declining would cause offence, accepted on behalf of the organisation and recorded in the gifts register within 5 business days.',
          'Cash or cash-equivalent gifts must never be accepted, regardless of value.',
        ],
      },
      {
        heading: '4. Confidentiality and Privacy',
        paragraphs: [
          'Employees must not access, use or disclose organisational or personal information except as required to perform their duties. Confidentiality obligations continue after employment ends.',
          'Personal information must be handled in accordance with the Information Security Policy and applicable privacy law.',
        ],
      },
      {
        heading: '5. Public Comment and Social Media',
        paragraphs: [
          'Only authorised spokespeople may comment publicly on behalf of the organisation. Employees making personal comments on matters related to the organisation must make clear they are speaking personally and must not disclose confidential information.',
        ],
      },
      {
        heading: '6. Reporting Wrongdoing',
        paragraphs: [
          'Employees who suspect fraud, corruption, or a serious breach of this Code should report the matter to the People and Culture team or through the confidential disclosure channel.',
          'The organisation will protect a person who makes a disclosure in good faith from detrimental action.',
        ],
      },
    ],
  },
];

/** Held back from the initial seed so it can be uploaded live during the demonstration. */
export const DEMO_UPLOAD_POLICY: PolicySpec = {
  fileName: 'employee-wellbeing-support-policy.pdf',
  title: 'Employee Wellbeing and Support Policy',
  category: 'Wellbeing',
  version: '1.0',
  summary:
    'Employee assistance programme, mental health support, wellbeing leave and return-to-work support.',
  requiresAcknowledgement: false,
  sections: [
    {
      heading: '1. Purpose',
      paragraphs: [
        `${ORGANISATION} is committed to supporting the physical and mental wellbeing of its employees. This policy describes the wellbeing support available and how employees can access it.`,
      ],
    },
    {
      heading: '2. Employee Assistance Programme',
      paragraphs: [
        'The organisation provides a confidential Employee Assistance Programme (EAP) at no cost to employees. Employees and their immediate family members are entitled to 6 counselling sessions per person per calendar year.',
        'EAP services are delivered by an external provider. The organisation does not receive information identifying who has used the service.',
        'Employees can access the EAP by calling the provider directly on the number published on the intranet, 24 hours a day, 7 days a week.',
      ],
    },
    {
      heading: '3. Wellbeing Leave',
      paragraphs: [
        'In addition to personal leave, permanent employees are entitled to 2 days of paid wellbeing leave each calendar year. Wellbeing leave may be taken for preventative health appointments, mental health, or personal wellbeing activities.',
        'Wellbeing leave does not accumulate from year to year and is not paid out on termination. A medical certificate is not required for wellbeing leave.',
      ],
    },
    {
      heading: '4. Mental Health Support',
      paragraphs: [
        'Managers who become aware that an employee may be experiencing mental ill health should approach the employee privately, listen without judgement, and make them aware of the Employee Assistance Programme.',
        'Managers must not diagnose, and must not disclose an employee’s health information to colleagues.',
      ],
    },
    {
      heading: '5. Return to Work Support',
      paragraphs: [
        'Employees returning from an absence of more than 4 weeks are offered a return-to-work discussion with their manager to agree any adjustments, a graduated return schedule, and a review date.',
        'Reasonable adjustments may include modified duties, adjusted hours, or a temporary flexible work arrangement under the Workplace Flexibility Policy.',
      ],
    },
  ],
};

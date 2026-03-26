require('dotenv').config()
const mongoose = require('mongoose')
const Faculty  = require('../models/faculty')
const Student  = require('../models/Student')
const User     = require('../models/User')
const { calculateReadinessScore, analyzeSkillGap } = require('../controllers/analytics.controller')

const skills    = ['React','Node.js','MongoDB','Python','Java','SQL','AWS','Docker','Git','JavaScript','TypeScript','Django','Flask','Machine Learning','REST API']
const langs     = ['JavaScript','Python','Java','C++','TypeScript','Go']
const companies = ['TCS','Infosys','Wipro','Cognizant','Accenture','HCL','Tech Mahindra','Capgemini','IBM','Google','Microsoft','Amazon']

function rnd(arr)          { return arr[Math.floor(Math.random() * arr.length)] }
function rndInt(min, max)  { return Math.floor(Math.random() * (max - min + 1)) + min }
function rndFloat(min, max){ return parseFloat((Math.random() * (max - min) + min).toFixed(2)) }
function pickN(arr, n)     { return [...arr].sort(() => 0.5 - Math.random()).slice(0, n) }

const realStudents = [
  { enrollment: '0101IT221001', name: 'Aaku Khaped' },
  { enrollment: '0101IT221005', name: 'Aditya Solanki' },
  { enrollment: '0101IT221006', name: 'Akash Singh Bhadauriya' },
  { enrollment: '0101IT221007', name: 'Anil' },
  { enrollment: '0101IT221008', name: 'Ankit Baghel' },
  { enrollment: '0101IT221009', name: 'Anurodh Tiwari' },
  { enrollment: '0101IT221010', name: 'Arjun Singh Khangar' },
  { enrollment: '0101IT221011', name: 'Ayush Ahirwar' },
  { enrollment: '0101IT221012', name: 'Ayush Kumar' },
  { enrollment: '0101IT221013', name: 'Bhanu Pratap Singh' },
  { enrollment: '0101IT221014', name: 'Darshan Misaal' },
  { enrollment: '0101IT221015', name: 'Deepti Deshpande' },
  { enrollment: '0101IT221017', name: 'Dhanraj Kushwaha' },
  { enrollment: '0101IT221018', name: 'Dupali Sharma' },
  { enrollment: '0101IT221019', name: 'Ekta Palohiya' },
  { enrollment: '0101IT221020', name: 'Gavesh Batham' },
  { enrollment: '0101IT221021', name: 'Gourav Sahite' },
  { enrollment: '0101IT221040', name: 'Muskan Dhakariya' },
  { enrollment: '0101IT221041', name: 'Nakul Dubey' },
  { enrollment: '0101IT221056', name: 'Rahul Mishra' },
]

function makeEmail(name, enrollment) {
  const clean = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')
  return `${clean}.${enrollment.slice(-4)}@it.edu`
}

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/acadplace'
  await mongoose.connect(uri)
  console.log('✅ Connected to MongoDB')

  await Student.deleteMany({})
  await User.deleteMany({})
  await Faculty.deleteMany({})
  console.log('🗑  Cleared existing data')

  // Seed admin and TPO
  await User.create({ name: 'Admin User',    email: 'admin@it.edu', password: 'admin123', role: 'admin' })
  await User.create({ name: 'Dr. Rakesh Jain', email: 'tpo@it.edu', password: 'tpo123',   role: 'tpo'   })
  console.log('✅ Admin and TPO created')

  // Seed faculty
  const facultyData = [
    { facultyId: 'FAC001', name: 'Dr. Roopam Gupta', email: 'roopam@it.edu',        password: 'roopam123', subject: 'Advanced Computer Networks', subjectCode: 'ACN701' },
    { facultyId: 'FAC002', name: 'Anjana Pandey',    email: 'anjana.pandey@it.edu',  password: 'anjana123', subject: 'Blockchain Technology',       subjectCode: 'BCT702' },
    { facultyId: 'FAC003', name: 'Anjana Patney',    email: 'anjana.patney@it.edu',  password: 'patney123', subject: 'Information Security',        subjectCode: 'ISC703' },
  ]
  for (const f of facultyData) {
    await Faculty.create(f)
  }
  console.log('✅ Faculty seeded (passwords hashed by pre-save hook)')

  const students = []
  for (const s of realStudents) {
    const { enrollment, name } = s
    const email      = makeEmail(name, enrollment)
    const cgpa       = rndFloat(5.5, 9.8)
    const division   = rnd(['A', 'B', 'C', 'D'])
    const techSkills = pickN(skills, rndInt(2, 6))
    const progLangs  = pickN(langs, rndInt(1, 3))

    const semesterResults = Array.from({ length: 8 }, (_, sem) => ({
      semester: sem + 1,
      sgpa:     rndFloat(5.0, 10.0),
      backlogs: Math.random() < 0.1 ? rndInt(1, 2) : 0
    }))

    const projectsArr = []
    if (Math.random() > 0.3) {
      projectsArr.push({
        title:       `${rnd(['Smart','Cloud','AI','Web','Mobile'])} ${rnd(['System','App','Platform','Dashboard','Portal'])}`,
        type:        'major',
        techStack:   pickN(techSkills, Math.min(3, techSkills.length)),
        year:        2024,
        description: 'Final year major project'
      })
    }
    if (Math.random() > 0.4) {
      projectsArr.push({
        title:    `${rnd(['Student','Library','Expense','Quiz','Chat'])} ${rnd(['Manager','Tracker','App','System'])}`,
        type:     'minor',
        techStack: pickN(techSkills, 2),
        year:     2023
      })
    }

    const certsArr = []
    if (Math.random() > 0.5) {
      certsArr.push({
        title:     rnd(['AWS Cloud Practitioner','Python for Data Science','Full Stack Web Dev','Java Programming','SQL Basics']),
        issuedBy:  rnd(['Coursera','Udemy','NPTEL','AWS','Oracle']),
        issueDate: '2023-06-01'
      })
    }

    const internsArr = []
    if (Math.random() > 0.45) {
      internsArr.push({
        company:     rnd(companies),
        role:        rnd(['Web Developer Intern','Software Intern','Data Analyst Intern','Backend Intern','ML Intern']),
        startDate:   '2024-05-01',
        endDate:     '2024-07-31',
        stipend:     rndInt(5000, 25000),
        isCompleted: true
      })
    }

    const statusRoll = Math.random()
    let placementStatus = 'not_started'
    let placedCompany, placedPackage
    if (cgpa >= 7.5 && statusRoll > 0.6) {
      placementStatus = 'placed'
      placedCompany   = rnd(companies)
      placedPackage   = rndFloat(4, 18)
    } else if (statusRoll > 0.4) {
      placementStatus = 'in_process'
    } else if (statusRoll < 0.05) {
      placementStatus = 'higher_studies'
    }

    const student = new Student({
      enrollmentNumber:     enrollment,
      name,
      email,
      phone:                `98${rndInt(10000000, 99999999)}`,
      branch:               'Information Technology',
      division,
      batch:                '2022-2026',
      semester:             8,
      cgpa,
      semesterResults,
      totalBacklogs:        semesterResults.reduce((s, r) => s + r.backlogs, 0),
      activeBacklogs:       0,
      technicalSkills:      techSkills,
      programmingLanguages: progLangs,
      softSkills:           pickN(['Communication','Leadership','Teamwork','Problem Solving','Time Management'], rndInt(1, 3)),
      projects:             projectsArr,
      certifications:       certsArr,
      internships:          internsArr,
      achievements:         Math.random() > 0.6 ? [rnd(['Won Hackathon 2024','Published Research Paper','Smart India Hackathon Finalist','Best Project Award'])] : [],
      placementStatus,
      placedCompany,
      placedPackage
    })

    student.placementReadinessScore = calculateReadinessScore(student)
    student.skillGaps               = analyzeSkillGap(student)
    student.suggestedSkills         = student.skillGaps.slice(0, 3)
    students.push(student)

    const newUser = new User({ name, email, password: 'student123', role: 'student', enrollmentNumber: enrollment })
    await newUser.save()
  }

  await Student.insertMany(students)
  console.log(`✅ Seeded ${students.length} students`)
  console.log('\n📋 Login Credentials:')
  console.log('  Admin   → admin@it.edu       / admin123')
  console.log('  TPO     → tpo@it.edu         / tpo123')
  console.log('  Faculty → roopam@it.edu      / roopam123')
  console.log('  Faculty → anjana.pandey@it.edu / anjana123')
  console.log('  Student → (email from above)  / student123')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1) })
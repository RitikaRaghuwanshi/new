// back-end/seedFaculty.js
// Run with: node seedFaculty.js
// Seeds the 3 IT department faculty members shown on your login page

require('dotenv').config()
const mongoose = require('mongoose')
const Faculty  = require('./models/Faculty')
const User     = require('./models/User')

const FACULTY_DATA = [
  {
    facultyId:   'FAC001',
    name:        'Dr. Roopam',
    email:       'roopam@acadplace.edu',
    phone:       '9876543201',
    subject:     'Data Structures & Algorithms',
    subjectCode: 'CS301',
    password:    'faculty123',
  },
  {
    facultyId:   'FAC002',
    name:        'A. Pandey',
    email:       'pandey@acadplace.edu',
    phone:       '9876543202',
    subject:     'Database Management Systems',
    subjectCode: 'CS302',
    password:    'faculty123',
  },
  {
    facultyId:   'FAC003',
    name:        'A. Patney',
    email:       'patney@acadplace.edu',
    phone:       '9876543203',
    subject:     'Web Technologies',
    subjectCode: 'CS303',
    password:    'faculty123',
  },
]

async function seedFaculty() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    let created = 0, skipped = 0

    for (const f of FACULTY_DATA) {
      // Skip if already exists
      const existingFaculty = await Faculty.findOne({
        $or: [{ facultyId: f.facultyId }, { email: f.email }]
      })

      if (existingFaculty) {
        console.log(`⏩ Skipping ${f.name} — already exists`)
        skipped++
        continue
      }

      // Create faculty record
      await Faculty.create({
        facultyId:   f.facultyId,
        name:        f.name,
        email:       f.email,
        phone:       f.phone,
        subject:     f.subject,
        subjectCode: f.subjectCode,
      })

      // Create login User record
      const existingUser = await User.findOne({ email: f.email })
      if (!existingUser) {
        await User.create({
          name:             f.name,
          email:            f.email,
          password:         f.password,
          role:             'faculty',
          enrollmentNumber: f.facultyId,
        })
      }

      console.log(`✅ Created faculty: ${f.name} (${f.subject})`)
      created++
    }

    console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`)
    console.log('\n📋 Login credentials:')
    FACULTY_DATA.forEach(f => {
      console.log(`   ${f.name.padEnd(15)} | ${f.email.padEnd(30)} | password: ${f.password}`)
    })

  } catch (err) {
    console.error('❌ Seed failed:', err.message)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seedFaculty()
// Run once: node seedFaculty.js
// Seeds 3 demo faculty members into MongoDB

require('dotenv').config()
const mongoose = require('moAnjanangoose')

// ✅ Import the Faculty model properly
const Faculty = require('./models/faculty');

const FACULTY_DATA = [
  {
    facultyId:   'FAC001',
    name:        'Dr. Roopam Gupta',
    email:       'roopam@it.edu',
    password:    'roopam123',
    subject:     'Advanced Computer Networks',
    subjectCode: 'ACN701',
    role:        'faculty'
  },
  {
    facultyId:   'FAC002',
    name:        ' Pandey',
    email:       'anjana.pandey@it.edu',
    password:    'anjana123',
    subject:     'Blockchain Technology',
    subjectCode: 'BCT702',
    role:        'faculty'
  },
  {
    facultyId:   'FAC003',
    name:        'Anjana Patney',
    email:       'anjana.patney@it.edu',
    password:    'patney123',
    subject:     'Information Security',
    subjectCode: 'ISC703',
    role:        'faculty'
  }
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/acadplace')
    console.log('Connected to MongoDB')

    for (const f of FACULTY_DATA) {
      await Faculty.findOneAndUpdate(
        { facultyId: f.facultyId },
        f,
        { upsert: true, new: true }
      )
      console.log(`✅ Seeded: ${f.name}`)
    }

    console.log('\n🎉 Faculty seeded successfully!')
    console.log('\nDemo Login Credentials:')
    console.log('  Dr. Roopam Gupta  → roopam@it.edu    / roopam123')
    console.log('  Anjana Pandey     → anjana.pandey@it.edu / anjana123')
    console.log('  Anjana Patney     → anjana.patney@it.edu / patney123')
    process.exit(0)
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  }
}

seed()
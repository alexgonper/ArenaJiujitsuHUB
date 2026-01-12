
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Franchise = require('../models/Franchise');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { connectDB } = require('../config/database');

const BASE_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

async function fetchJson(endpoint) {
    const url = `${BASE_URL}${endpoint}`;
    // console.log(`Fetching from ${url}...`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    }
}

async function importData() {
    try {
        await connectDB();
        console.log('Connected to local database.');

        const franchisesData = await fetchJson('/franchises');
        const franchises = franchisesData.data || [];
        console.log(`Fetched ${franchises.length} franchises.`);

        const studentsData = await fetchJson('/students');
        const students = studentsData.data || [];
        console.log(`Fetched ${students.length} students.`);

        const teachersData = await fetchJson('/teachers');
        const teachers = teachersData.data || [];
        console.log(`Fetched ${teachers.length} teachers.`);

        const cleanFranchises = franchises.map(f => {
            const copy = { ...f };
            if (copy.id && !copy._id) copy._id = copy.id;
            return copy;
        });

        const cleanStudents = students.map(s => {
            const student = { ...s };
            if (student.franchiseId && typeof student.franchiseId === 'object' && student.franchiseId._id) {
                student.franchiseId = student.franchiseId._id;
            }
            // Ensure ID consistency if provided
            if (student.id && !student._id) student._id = student.id;
            return student;
        });

        const cleanTeachers = teachers.map(t => {
            const teacher = { ...t };
            if (teacher.franchiseId && typeof teacher.franchiseId === 'object' && teacher.franchiseId._id) {
                teacher.franchiseId = teacher.franchiseId._id;
            }
            if (teacher.id && !teacher._id) teacher._id = teacher.id;
            return teacher;
        });

        console.log('Clearing existing data...');
        await Franchise.deleteMany({});
        await Student.deleteMany({});
        await Teacher.deleteMany({});

        console.log('Inserting new data...');
        if (cleanFranchises.length > 0) await Franchise.insertMany(cleanFranchises);
        if (cleanStudents.length > 0) await Student.insertMany(cleanStudents);
        if (cleanTeachers.length > 0) await Teacher.insertMany(cleanTeachers);

        console.log('Data import complete!');
        process.exit(0);
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importData();

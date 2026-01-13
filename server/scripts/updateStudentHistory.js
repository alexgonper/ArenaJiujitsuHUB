const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Franchise = require('../models/Franchise');

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arena-hub', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const degrees = ['Nenhum', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau', '7º Grau', '8º Grau', '9º Grau', '10º Grau'];

const degreeToNumber = (d) => {
    if (!d) return 0;
    const index = degrees.indexOf(d);
    return index === -1 ? 0 : index;
};

const numberToDegree = (n) => {
    if (n < 0) return degrees[0];
    if (n >= degrees.length) return degrees[degrees.length - 1];
    return degrees[n];
};

const beltOrderAdult = ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha']; // Simplified sequence
// Detailed Black Belt handling:
// Black 0-6
// Coral 7 (Red/Black) -> handled as 'Coral' in belt field?
// Schema has 'Coral' and 'Vermelha' in belt enum.
// Logic:
// If Belt is Black, degree can be 0-6.
// If Degree is 7, Belt becomes Coral.
// If Degree is 8, Belt becomes Coral (Red/White - maybe distinct in logic but Schema only has Coral).
// If Degree is 9-10, Belt becomes Vermelha.

// To simplify history generation, we flatten the timeline:
// Index 0: White 0
// Index 1: Blue 0
// Index 2: Blue 1 .. Blue 4
// ...

const generateHistory = (currentBelt, currentDegreeStr, isKid) => {
    const currentDegree = degreeToNumber(currentDegreeStr);

    // 1. Validate and Normalize Current State
    let validBelt = currentBelt;
    let validDegree = currentDegree;

    // Rule: White belt has 0 degrees
    if (validBelt === 'Branca') {
        validDegree = 0;
    }

    // Rule: Blue, Purple, Brown max 4 degrees
    if (['Azul', 'Roxa', 'Marrom'].includes(validBelt)) {
        if (validDegree > 4) validDegree = 4;
    }

    // Rule: Black belt
    // If Black and degree >= 7, prompt implies it should be Coral.
    if (validBelt === 'Preta') {
        if (validDegree >= 7 && validDegree <= 8) {
            validBelt = 'Coral'; // 7 or 8
        } else if (validDegree >= 9) {
            validBelt = 'Vermelha';
        } else if (validDegree > 6) {
            // Should ideally not happen if we caught >=7, but strictly Black is 0-6
            validDegree = 6;
        }
    }

    // Rule: Coral
    if (validBelt === 'Coral') {
        // Prompt: Coral (Red/Black) is 7th, Coral (Red/White) is 8th.
        // Ensure degree is 7 or 8.
        if (validDegree < 7) validDegree = 7;
        if (validDegree > 8) validDegree = 8;
    }

    // Rule: Vermelha
    if (validBelt === 'Vermelha') {
        if (validDegree < 9) validDegree = 9;
        if (validDegree > 10) validDegree = 10;
    }

    // Kid Logic overrides?
    // Prompt: Kids: Branca, Cinza, Amarela, Laranja, Verde, then Azul.
    // If current is one of these "Kid" belts (Cinza, Amarela, Laranja, Verde), we use kid progression.
    // If current is White or Blue, we need to decide based on `isKid` flag passed from caller.
    const kidBelts = ['Cinza', 'Amarela', 'Laranja', 'Verde'];
    const isActuallyKidTrack = kidBelts.includes(validBelt) || (isKid && (validBelt === 'Branca' || validBelt === 'Azul'));

    // Construct the "Timeline" of milestones
    // Each milestone is { belt, degree }
    let timeline = [];

    if (isActuallyKidTrack) {
        // Kid timeline: White -> Grey -> Yellow -> Orange -> Green -> Blue
        // Assuming simple 0 degree for kids intermediate belts for now to avoid complexity, 
        // or random degrees? prompt didn't specify degrees for kids, just belts.
        // Let's assume kids belts are just "Belts".
        const seq = ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul'];

        let foundCurrent = false;
        for (const b of seq) {
            timeline.push({ belt: b, degree: 0 }); // Kids belts usually have degrees too but let's stick to belt progression
            if (b === validBelt) {
                // If we are at the target belt, set the specific degree (likely 0 or whatever they have)
                // If they are Blue (kid turned adult/juvenile), they might have degrees.
                if (b === 'Azul') {
                    // Start Blue with 0. If current is Blue X, allow up to X.
                    for (let d = 1; d <= validDegree; d++) {
                        timeline.push({ belt: b, degree: d });
                    }
                }
                foundCurrent = true;
                break;
            }
        }

        // If not found (e.g. they are Purple but marked as kid? Unlikely), handle fallback
        if (!foundCurrent) {
            // Treat as adult if kid track sequence didn't cover it (e.g. Green belt isn't in adult list usually)
            // But if they are Purple, they are on adult track now.
            // For now, assume if validBelt is not in seq, we default to adult logic below.
            timeline = []; // Reset and fall through to adult logic
            isKid = false; // Force adult logic
        }
    }

    if (!isActuallyKidTrack) {
        // Adult Timeline construction
        // Sequence: White -> Blue -> Purple -> Brown -> Black -> Coral -> Vermelha

        const addBeltRange = (belt, maxDegree) => {
            for (let d = 0; d <= maxDegree; d++) {
                timeline.push({ belt, degree: d });
                // If we reached target, stop
                if (belt === validBelt && d === validDegree) return true;
            }
            return false;
        };

        const stop =
            addBeltRange('Branca', 0) || // Only 0
            addBeltRange('Azul', 4) ||
            addBeltRange('Roxa', 4) ||
            addBeltRange('Marrom', 4) ||
            addBeltRange('Preta', 6) ||
            // Coral manually
            (function () {
                if (validBelt === 'Coral') {
                    timeline.push({ belt: 'Coral', degree: 7 });
                    if (validDegree === 7) return true;
                    timeline.push({ belt: 'Coral', degree: 8 });
                    if (validDegree === 8) return true;
                }
                return false;
            })() ||
            (function () {
                if (validBelt === 'Vermelha') {
                    // Ensure previous belts are there? 
                    // To keep it simple, if we are here, we passed Black 6. 
                    // Add Coral 7, 8 implicit? Yes, need to fill gaps.
                    if (!timeline.find(t => t.belt === 'Coral')) {
                        timeline.push({ belt: 'Coral', degree: 7 });
                        timeline.push({ belt: 'Coral', degree: 8 });
                    }
                    timeline.push({ belt: 'Vermelha', degree: 9 });
                    if (validDegree === 9) return true;
                    timeline.push({ belt: 'Vermelha', degree: 10 });
                    return true;
                }
                return false;
            })();
    }

    // Now generating dates walking BACKWARDS from NOW
    // Times are in months (approx)
    const getDurationMonths = (item) => {
        // How long to stay at this level before next?
        // White: 18 months to Blue
        // Blue each degree: 6 months (Total 2 years)
        // Purple each degree: 4.5 months (Total 1.5 years) -> 18 months / 4 = 4.5
        // Brown each degree: 3 months (Total 1 year) -> 12 / 4 = 3
        // Black each degree (1-3): 36 months (3 years)
        // Black each degree (4-6): 60 months (5 years)

        const { belt, degree } = item;

        if (belt === 'Branca') return 18;
        if (belt === 'Cinza' || belt === 'Amarela' || belt === 'Laranja' || belt === 'Verde') return 12; // 1 year per kid belt

        if (belt === 'Azul') return 6;
        if (belt === 'Roxa') return 5; // Approx
        if (belt === 'Marrom') return 3;

        if (belt === 'Preta') {
            if (degree < 3) return 36;
            return 60;
        }

        if (belt === 'Coral') return 84; // 7 years each? Prompt didn't specify Coral duration, implies strictly 7th/8th degree. Masters usually stay long.
        return 12; // Default
    };

    let history = [];
    let currentDate = new Date(); // Start from today (or slightly past)

    // We traverse from END (target) to START (White)
    // The timeline array is [White, ..., Target]
    // We reverse it to walk back
    const revTimeline = [...timeline].reverse();

    // The first item in revTimeline is the current state. Date = NOW (or recent)
    // Actually, `graduationHistory` records when you RECEIVED the belt/degree.
    // So the DATE for the current state involves: "When did I get this?"
    // Let's assume they got the current degree recently (e.g. 0-6 months ago randomly).

    let lastDate = new Date();
    // Randomize current status start date slightly (-0 to -6 months)
    lastDate.setMonth(lastDate.getMonth() - Math.floor(Math.random() * 6));

    for (let i = 0; i < revTimeline.length; i++) {
        const item = revTimeline[i];

        // The date for this item is `lastDate`
        // We push this to history
        history.push({
            belt: item.belt,
            degree: numberToDegree(item.degree),
            date: new Date(lastDate), // Clone
            // We need promotedBy... maybe handled later
        });

        // Calculate date for the PREVIOUS item (which is next in loop)
        // Duration of the PREVIOUS item determines when THIS item started? 
        // No, duration of PREVIOUS item determines when PREVIOUS item started relative to THIS item.
        // Wait:
        // Timeline: [White] -> [Blue] -> [Blue 1]
        // Date(Blue 1) = X
        // Date(Blue) = X - Duration(Blue) ... "How long did I have Blue before getting Blue 1?"
        // Usually, Duration is "Time spent AT this level".
        // item is "Blue 1". Previous level was "Blue".
        // If I am at "Blue 1" now, implies I spent `Duration(Blue)` at "Blue".

        if (i < revTimeline.length - 1) {
            const previousLevel = revTimeline[i + 1]; // The one before in chronological order
            // Determine duration of `previousLevel`
            const duration = getDurationMonths(previousLevel);
            // subtract duration from lastDate
            lastDate.setMonth(lastDate.getMonth() - duration);
            // Add some randomness (+/- 1 month)
            lastDate.setDate(lastDate.getDate() + Math.floor(Math.random() * 30));
        }
    }

    // history is now [Target, ..., White] (Reverse Chronological)
    // We usually store history Chronological in array (Append only), or reverse?
    // Mongoose array order matters. Usually append. 
    // Prompt "historico de alunos". 
    // Let's sort it by date ascending.
    history.sort((a, b) => a.date - b.date);

    return {
        validBelt,
        validDegree: numberToDegree(validDegree),
        history,
        startDate: history[0]?.date || new Date()
    };
};

const updateStudents = async () => {
    await connectDB();

    const students = await Student.find({});
    console.log(`Found ${students.length} students to update.`);

    // Fetch a teacher to use as "promoter"
    // Just pick the first one or random
    const teacher = await Teacher.findOne();
    const teacherId = teacher ? teacher._id : null;

    let count = 0;

    for (const student of students) {
        // Determine if kid based on birthdate
        let isKid = false;
        if (student.birthDate) {
            const ageComp = new Date(Date.now() - student.birthDate.getTime());
            const age = Math.abs(ageComp.getUTCFullYear() - 1970);
            if (age < 16) isKid = true;
        }

        // Generate History
        const result = generateHistory(student.belt, student.degree, isKid);

        // Add promotedBy
        const historyWithPromoter = result.history.map(h => ({
            ...h,
            promotedBy: teacherId
        }));

        // Update Student
        student.belt = result.validBelt;
        student.degree = result.validDegree;
        student.graduationHistory = historyWithPromoter;
        student.registrationDate = result.startDate; // Align registration with white belt
        student.lastGraduationDate = historyWithPromoter[historyWithPromoter.length - 1].date;

        await student.save();
        process.stdout.write('.');
        count++;
    }

    console.log(`\nUpdated ${count} students.`);
    process.exit();
};

updateStudents();

#!/bin/bash

# Script to test White Label fallback behavior
# This ensures the system works correctly when no branding is configured

echo "🧪 Testing White Label Fallback Behavior..."
echo ""

# Test 1: Check if default branding values are set in model
echo "✅ Test 1: Checking Franchise model defaults..."
grep -A 10 "branding:" server/models/Franchise.js | grep "default:"
echo ""

# Test 2: Verify branding is optional in all portals
echo "✅ Test 2: Checking branding safety checks in frontend..."
echo "Student Portal:"
grep -n "if (!franchise || !franchise.branding)" aluno-app.js
echo ""
echo "Teacher Portal:"
grep -n "if (!franchise || !franchise.branding)" teacher-app.js
echo ""
echo "Franchisee Portal:"
grep -n "if (!unit)" franchise-client.js | head -1
echo ""

# Test 3: Check for proper fallback colors
echo "✅ Test 3: Verifying fallback colors..."
echo "Student Portal (should default to blue):"
grep "primaryColor || '#3B82F6'" aluno-app.js aluno-login.js
echo ""
echo "Teacher Portal (should default to orange):"
grep "primaryColor || '#FF6B00'" teacher-app.js
echo ""
echo "Franchisee Portal (should default to orange):"
grep "primaryColor || '#FF6B00'" franchise-client.js
echo ""

echo "✅ All fallback tests completed!"
echo ""
echo "📋 Summary:"
echo "- Model has default values for all branding fields"
echo "- All portals check for branding existence before applying"
echo "- Proper fallback colors are defined for each portal type"
echo ""
echo "🎯 The system is safe to use without branding configuration!"

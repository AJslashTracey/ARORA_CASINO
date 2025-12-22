/**
 * Test script for OpenPLZ API address verification
 * Run with: node test-address-verification.js
 */

// OpenPLZ API address verification function (copy from server.js)
const verifyAddressWithOpenPLZ = async (street, city, postalCode, country) => {
    const countryMap = {
        'deutschland': 'de',
        'germany': 'de',
        'österreich': 'at',
        'austria': 'at',
        'schweiz': 'ch',
        'switzerland': 'ch',
        'liechtenstein': 'li'
    };

    const countryCode = countryMap[country.toLowerCase()];
    
    if (!countryCode) {
        return { isValid: true, message: 'Country not covered by address verification' };
    }

    try {
        const localityUrl = `https://openplzapi.org/${countryCode}/Localities?postalCode=${encodeURIComponent(postalCode)}`;
        const localityResponse = await fetch(localityUrl);
        
        if (!localityResponse.ok) {
            console.warn('OpenPLZ API not reachable, skipping verification');
            return { isValid: true, warning: 'Address verification service unavailable' };
        }
        
        const localities = await localityResponse.json();
        
        const cityMatch = localities.some(loc => 
            loc.name.toLowerCase().includes(city.toLowerCase()) || 
            city.toLowerCase().includes(loc.name.toLowerCase())
        );
        
        if (!cityMatch) {
            return { 
                isValid: false, 
                error: 'Postal code and city do not match. Please verify your address.' 
            };
        }
        
        const streetUrl = `https://openplzapi.org/${countryCode}/Streets?name=${encodeURIComponent(street)}&postalCode=${encodeURIComponent(postalCode)}`;
        const streetResponse = await fetch(streetUrl);
        
        if (streetResponse.ok) {
            const streets = await streetResponse.json();
            
            if (streets && streets.length > 0) {
                return { isValid: true, verified: true };
            }
        }
        
        return { 
            isValid: true, 
            verified: 'partial',
            message: 'Postal code and city verified. Street could not be confirmed.' 
        };
        
    } catch (error) {
        console.error('OpenPLZ API error:', error.message);
        return { isValid: true, warning: 'Address verification unavailable' };
    }
};

// Test cases
const testCases = [
    {
        name: 'Valid Berlin Address',
        street: 'Pariser Platz',
        city: 'Berlin',
        postalCode: '10117',
        country: 'Germany',
        expectedValid: true
    },
    {
        name: 'Valid Munich Address',
        street: 'Marienplatz',
        city: 'München',
        postalCode: '80331',
        country: 'Germany',
        expectedValid: true
    },
    {
        name: 'Invalid - Wrong City for Postal Code',
        street: 'Teststraße',
        city: 'Hamburg',
        postalCode: '10117', // This is Berlin's postal code
        country: 'Germany',
        expectedValid: false
    },
    {
        name: 'Valid Vienna Address',
        street: 'Stephansplatz',
        city: 'Wien',
        postalCode: '1010',
        country: 'Austria',
        expectedValid: true
    },
    {
        name: 'Valid Swiss Address',
        street: 'Bahnhofstrasse',
        city: 'Zürich',
        postalCode: '8001',
        country: 'Switzerland',
        expectedValid: true
    },
    {
        name: 'Unsupported Country (USA)',
        street: '123 Main Street',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
        expectedValid: true // Should pass without verification
    }
];

// Run tests
async function runTests() {
    console.log('🧪 Testing OpenPLZ API Address Verification\n');
    console.log('='.repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    for (const test of testCases) {
        console.log(`\n📍 Test: ${test.name}`);
        console.log(`   Address: ${test.street}, ${test.city}, ${test.postalCode}, ${test.country}`);
        
        const result = await verifyAddressWithOpenPLZ(
            test.street,
            test.city,
            test.postalCode,
            test.country
        );
        
        const testPassed = result.isValid === test.expectedValid;
        
        console.log(`   Result: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
        if (result.verified) {
            console.log(`   Verification: ${result.verified === true ? '✅ Fully verified' : '⚠️ Partially verified'}`);
        }
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        if (result.message) {
            console.log(`   Message: ${result.message}`);
        }
        if (result.warning) {
            console.log(`   Warning: ${result.warning}`);
        }
        
        if (testPassed) {
            console.log(`   Status: ✅ PASSED`);
            passed++;
        } else {
            console.log(`   Status: ❌ FAILED`);
            failed++;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! Address verification is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Please review the results above.');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});


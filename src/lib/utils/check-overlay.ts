// Utility to check overlay status from main window
import { commands } from '$lib/bindings';

export async function checkOverlayStatus() {
    console.log('🔍 === OVERLAY STATUS CHECK ===\n');
    
    // Test 1: Show overlay
    console.log('1️⃣ Showing overlay...');
    const showResult = await commands.showOverlayWindow();
    console.log('   Result:', showResult);
    
    // Test 2: Wait for init
    console.log('\n2️⃣ Waiting 3 seconds for overlay initialization...');
    await new Promise(r => setTimeout(r, 3000));
    
    // Test 3: Send test event
    console.log('\n3️⃣ Sending test click event at (500, 300)...');
    const feedbackResult = await commands.emitVisualFeedback('click', 500, 300, null);
    console.log('   Result:', feedbackResult);
    
    // Instructions
    console.log('\n📊 === WHAT TO CHECK ===');
    console.log('1. Screen: Look at TOP-LEFT corner');
    console.log('   - Should see GREEN debug box with:');
    console.log('     🎯 Overlay Active');
    console.log('     Status: ✅ Ready');
    console.log('     Events: 1 (or more)');
    console.log('     Feedbacks: 1');
    console.log('');
    console.log('2. Screen Center-Left:');
    console.log('   - Should see RED CIRCLE at (500, 300)');
    console.log('');
    console.log('3. If you see debug box but "Events: 0":');
    console.log('   → Events not reaching overlay!');
    console.log('');
    console.log('4. If you see "Events: 1" but no red circle:');
    console.log('   → Rendering issue (CSS/coordinates)');
    console.log('');
    console.log('5. If you see NOTHING at all:');
    console.log('   → Overlay not visible or route not loading');
    
    console.log('\n✅ Check complete! Look at your screen now.');
}

// Make it globally available in browser console
if (typeof window !== 'undefined') {
    (window as any).checkOverlay = checkOverlayStatus;
    console.log('💡 Run checkOverlay() in console to test overlay!');
}

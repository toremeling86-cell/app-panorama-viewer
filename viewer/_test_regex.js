// Test the _loadCSSIntoEditor regex
const testCases = [
    "linear-gradient(135deg, #1a0e05 0%, #6b3a0a 40%, #d4a017 80%, #f5c542 100%)",
    "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    "radial-gradient(at 20% 20%, #4c1d95 0%, transparent 50%), radial-gradient(at 80% 80%, #7c3aed 0%, transparent 50%)",
    "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
    "#0a0a1a"
];

const stopRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))\s*(\d+)?%?/g;

testCases.forEach((css, i) => {
    stopRegex.lastIndex = 0;
    const stops = [];
    let match;
    while ((match = stopRegex.exec(css)) !== null) {
        stops.push({ color: match[1], position: match[2] ? parseInt(match[2]) : null });
    }
    console.log(`Test ${i}: ${css.substring(0, 50)}...`);
    console.log(`  Stops found: ${stops.length}`);
    console.log(`  Details:`, JSON.stringify(stops));
    console.log();
});

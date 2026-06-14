
async function testHealth() {
  try {
    const res = await fetch('http://localhost:3000/api/health');
    const data = await res.json();
    console.log('Health check response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Health check failed:', err.message);
  }
}
testHealth();

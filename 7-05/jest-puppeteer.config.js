module.exports = {
  launch: {
    headless: process.env.HEADLESS !== 'false',
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
};


const path = require('path');

const express = require('express');
const puppeteer = require('puppeteer');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const router = express.Router();

const openApiPath = path.join(__dirname, '..', 'openapi.yaml');

swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'WEBTE2 API',
      version: '1.0.0'
    }
  },
  apis: [openApiPath]
});

router.get('/openapi.yaml', (req, res) => {
  return res.sendFile(openApiPath);
});

router.use(swaggerUi.serve);

router.get(
  '/',
  swaggerUi.setup(null, {
    explorer: true,
    customSiteTitle: 'WEBTE2 API Docs',
    swaggerOptions: {
      url: '/api/docs/openapi.yaml',
      persistAuthorization: true
    }
  })
);

router.get('/pdf', async (req, res) => {
  let browser;

  try {
    const docsUrl = `${req.protocol}://${req.get('host')}/api/docs`;

    browser = await puppeteer.launch({
      headless: true
    });

    const page = await browser.newPage();
    await page.goto(docsUrl, {
      waitUntil: 'networkidle0'
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: '70px',
        bottom: '70px',
        left: '24px',
        right: '24px'
      },
      headerTemplate:
        '<div style="width:100%;font-size:10px;text-align:center;color:#444;">API Documentation - WEBTE2</div>',
      footerTemplate:
        '<div style="width:100%;font-size:10px;text-align:center;color:#444;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=api-docs.pdf');
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Failed to generate PDF documentation'
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

module.exports = router;

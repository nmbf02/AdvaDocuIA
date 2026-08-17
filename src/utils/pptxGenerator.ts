import pptxgen from 'pptxgenjs';
import { SlideDeck, SlideItem, MetadataHeader, UploadedImage } from '../types';

export async function generateAdvansysPptx(
  deck: SlideDeck,
  metadata?: MetadataHeader,
  images: UploadedImage[] = []
): Promise<Blob> {
  const pptx = new pptxgen();

  // Explicit 16:9 Widescreen Layout (13.333 x 7.5 inches)
  pptx.defineLayout({ name: 'ADVANSYS_16_9', width: 13.333, height: 7.5 });
  pptx.layout = 'ADVANSYS_16_9';

  pptx.author = deck.author || 'Advansys Technology';
  pptx.company = 'Advansys';
  pptx.title = deck.title || metadata?.nombreProyecto || 'Propuesta Técnica Ejecutiva';
  pptx.subject = metadata?.ticketNo || 'Presentación Ejecutiva';

  // Advansys Color Palette - Matches Web Preview (Dark Tech Executive)
  const COLOR_BG_CANVAS = '0F172A'; // Slate 900 Canvas
  const COLOR_COVER_BG = '071C33'; // Deep Advansys Navy
  const COLOR_CARD_BG = '1E293B'; // Slate 800 Card Container
  const COLOR_INNER_BG = '0B132B'; // Deep Slate for Frames & Images
  const COLOR_BORDER = '334155'; // Slate 700 Border
  const COLOR_PRIMARY = '0A3D62'; // Advansys Deep Navy
  const COLOR_ACCENT = '2ECC71'; // Emerald Green
  const COLOR_SKY = '60A5FA'; // Sky Blue
  const COLOR_LIGHT_BLUE = '93C5FD'; // Soft Light Blue
  const COLOR_WHITE = 'FFFFFF'; // Pure White
  const COLOR_TEXT_LIGHT = 'F1F5F9'; // Slate 100 Text
  const COLOR_TEXT_MUTED = 'CBD5E1'; // Slate 300 Text
  const COLOR_FOOTER_TEXT = '94A3B8'; // Slate 400 Text

  // Map of image references for fast lookup
  const imageMap = new Map<string, UploadedImage>();
  images.forEach((img, idx) => {
    imageMap.set(`[IMAGEN_${idx + 1}]`, img);
    imageMap.set(img.id, img);
  });

  // Helper to add standard Slide Header (matching SlideViewer)
  const addSlideHeader = (
    slide: pptxgen.Slide,
    category?: string,
    titleText?: string,
    subtitleText?: string
  ) => {
    // Top decorative emerald line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.1,
      fill: { color: COLOR_ACCENT },
      line: { color: COLOR_ACCENT, width: 0 },
    });

    // Top-right ADVANSYS brand pill badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 11.2,
      y: 0.4,
      w: 1.333,
      h: 0.38,
      fill: { color: COLOR_CARD_BG },
      line: { color: COLOR_BORDER, width: 1 },
      rectRadius: 0.08,
    });

    slide.addText('ADVANSYS', {
      x: 11.2,
      y: 0.4,
      w: 1.333,
      h: 0.38,
      fontSize: 9.5,
      bold: true,
      color: COLOR_WHITE,
      align: 'center',
      valign: 'middle',
      charSpacing: 2,
    });

    // Category / Section Tag (Emerald Green uppercase)
    if (category) {
      slide.addText(category.toUpperCase(), {
        x: 0.8,
        y: 0.35,
        w: 10.0,
        h: 0.28,
        fontSize: 10,
        bold: true,
        color: COLOR_ACCENT,
        charSpacing: 1.5,
        fontFace: 'Segoe UI',
      });
    }

    // Main Slide Title (Bold White)
    if (titleText) {
      slide.addText(titleText, {
        x: 0.8,
        y: category ? 0.65 : 0.45,
        w: 10.2,
        h: 0.65,
        fontSize: 22,
        bold: true,
        color: COLOR_WHITE,
        fontFace: 'Segoe UI',
        wrap: true,
      });
    }

    // Subtitle (Soft Sky Blue)
    if (subtitleText) {
      slide.addText(subtitleText, {
        x: 0.8,
        y: category ? 1.32 : 1.15,
        w: 10.2,
        h: 0.35,
        fontSize: 12,
        color: COLOR_LIGHT_BLUE,
        fontFace: 'Segoe UI',
        wrap: true,
      });
    }
  };

  // Helper to add standard Slide Footer (matching SlideViewer)
  const addSlideFooter = (
    slide: pptxgen.Slide,
    currentSlideNum: number,
    totalSlides: number
  ) => {
    // Footer separator line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8,
      y: 6.8,
      w: 11.733,
      h: 0,
      line: { color: COLOR_BORDER, width: 1 },
    });

    const projectInfo = [
      metadata?.cliente || deck.client ? `Cliente: ${metadata?.cliente || deck.client}` : '',
      metadata?.ticketNo || deck.ticketNo ? `Ticket: ${metadata?.ticketNo || deck.ticketNo}` : '',
      deck.title || metadata?.nombreProyecto || '',
    ]
      .filter(Boolean)
      .join('   |   ');

    slide.addText(projectInfo, {
      x: 0.8,
      y: 6.88,
      w: 9.5,
      h: 0.4,
      fontSize: 9.5,
      color: COLOR_FOOTER_TEXT,
      fontFace: 'Segoe UI',
    });

    slide.addText(`${currentSlideNum} / ${totalSlides}`, {
      x: 10.533,
      y: 6.88,
      w: 2.0,
      h: 0.4,
      fontSize: 9.5,
      color: COLOR_TEXT_LIGHT,
      align: 'right',
      bold: true,
      fontFace: 'Segoe UI',
    });
  };

  const totalSlides = deck.slides.length;

  deck.slides.forEach((slideItem, index) => {
    const slide = pptx.addSlide();
    const slideNum = index + 1;

    // Add speaker notes to slide
    if (slideItem.speakerNotes) {
      slide.addNotes(slideItem.speakerNotes);
    }

    // =========================================================================
    // LAYOUT 1: COVER / TITLE SLIDE
    // =========================================================================
    if (slideItem.layout === 'title' || slideNum === 1) {
      // Dark Navy Background
      slide.background = { color: COLOR_COVER_BG };

      // Top Emerald Accent Bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.333,
        h: 0.15,
        fill: { color: COLOR_ACCENT },
        line: { color: COLOR_ACCENT, width: 0 },
      });

      // Ticket / Category Pill
      const ticketText = (
        slideItem.category || `TICKET ${deck.ticketNo || metadata?.ticketNo || 'PROPUESTA'}`
      ).toUpperCase();

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.0,
        y: 1.2,
        w: 3.2,
        h: 0.46,
        fill: { color: '0F2A4A' },
        line: { color: COLOR_ACCENT, width: 1.2 },
        rectRadius: 0.12,
      });

      slide.addText(ticketText, {
        x: 1.0,
        y: 1.2,
        w: 3.2,
        h: 0.46,
        fontSize: 10.5,
        bold: true,
        color: COLOR_ACCENT,
        align: 'center',
        valign: 'middle',
        charSpacing: 1.5,
        fontFace: 'Segoe UI',
      });

      // Main Presentation Title
      const titleText =
        slideItem.title ||
        deck.title ||
        metadata?.nombreProyecto ||
        'Propuesta Técnica de Solución';

      slide.addText(titleText, {
        x: 1.0,
        y: 1.85,
        w: 11.333,
        h: 1.9,
        fontSize: 34,
        bold: true,
        color: COLOR_WHITE,
        fontFace: 'Segoe UI',
        wrap: true,
      });

      // Subtitle
      const subtitleText =
        slideItem.subtitle ||
        deck.subtitle ||
        `Propuesta Técnica y Ejecutiva para ${deck.client || metadata?.cliente || 'el Cliente'}`;

      slide.addText(subtitleText, {
        x: 1.0,
        y: 3.85,
        w: 11.333,
        h: 0.95,
        fontSize: 16,
        color: COLOR_LIGHT_BLUE,
        fontFace: 'Segoe UI',
        wrap: true,
      });

      // Metadata Bottom Container Box
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.0,
        y: 5.25,
        w: 11.333,
        h: 1.3,
        fill: { color: '0B213D' },
        line: { color: '1E3E66', width: 1 },
        rectRadius: 0.15,
      });

      const client = deck.client || metadata?.cliente || 'Cliente Corporativo';
      const project = deck.project || metadata?.nombreProyecto || 'Propuesta de Solución';
      const date = deck.date || metadata?.fecha || new Date().toLocaleDateString('es-ES');

      slide.addText(
        [
          { text: 'Cliente: ', options: { bold: true, color: COLOR_WHITE } },
          { text: `${client}   •   `, options: { color: COLOR_LIGHT_BLUE } },
          { text: 'Proyecto: ', options: { bold: true, color: COLOR_WHITE } },
          { text: `${project}   •   `, options: { color: COLOR_LIGHT_BLUE } },
          { text: 'Fecha: ', options: { bold: true, color: COLOR_WHITE } },
          { text: `${date}`, options: { color: COLOR_TEXT_MUTED } },
        ],
        {
          x: 1.3,
          y: 5.45,
          w: 10.733,
          h: 0.45,
          fontSize: 12,
          fontFace: 'Segoe UI',
        }
      );

      slide.addText('Advansys Technology  •  Soluciones de Consultoría & Arquitectura de Software', {
        x: 1.3,
        y: 5.95,
        w: 10.733,
        h: 0.35,
        fontSize: 10,
        color: '64748B',
        fontFace: 'Segoe UI',
      });

      return;
    }

    // =========================================================================
    // STANDARD SLIDE CONTAINER (DARK SLATE EXECUTIVE THEME)
    // =========================================================================
    slide.background = { color: COLOR_BG_CANVAS };
    addSlideHeader(slide, slideItem.category, slideItem.title, slideItem.subtitle);
    addSlideFooter(slide, slideNum, totalSlides);

    // =========================================================================
    // LAYOUT 2: TWO-COLUMN (Alcance & Entregables / Comparativas)
    // =========================================================================
    if (slideItem.layout === 'two-column') {
      const colWidth = 5.7;
      const colHeight = 4.8;
      const startY = 1.85;

      // Left Column Container
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: startY,
        w: colWidth,
        h: colHeight,
        fill: { color: COLOR_CARD_BG },
        line: { color: COLOR_BORDER, width: 1 },
        rectRadius: 0.15,
      });

      // Left Header Tag
      const leftHeading = slideItem.leftTitle || 'Puntos Clave';
      slide.addText(`●  ${leftHeading}`, {
        x: 1.1,
        y: startY + 0.25,
        w: colWidth - 0.6,
        h: 0.45,
        fontSize: 14,
        bold: true,
        color: COLOR_SKY,
        fontFace: 'Segoe UI',
      });

      if (slideItem.leftBullets && slideItem.leftBullets.length > 0) {
        const bulletObjects = slideItem.leftBullets.map((b) => ({
          text: b,
          options: {
            fontSize: 11.5,
            color: COLOR_TEXT_LIGHT,
            bullet: true,
            spaceAfter: 10,
            fontFace: 'Segoe UI',
          },
        }));

        slide.addText(bulletObjects, {
          x: 1.1,
          y: startY + 0.8,
          w: colWidth - 0.6,
          h: colHeight - 1.0,
          valign: 'top' as const,
          wrap: true,
        });
      }

      // Right Column Container
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.833,
        y: startY,
        w: colWidth,
        h: colHeight,
        fill: { color: COLOR_CARD_BG },
        line: { color: COLOR_BORDER, width: 1 },
        rectRadius: 0.15,
      });

      // Right Header Tag
      const rightHeading = slideItem.rightTitle || 'Detalles & Entregables';
      slide.addText(`●  ${rightHeading}`, {
        x: 7.133,
        y: startY + 0.25,
        w: colWidth - 0.6,
        h: 0.45,
        fontSize: 14,
        bold: true,
        color: COLOR_ACCENT,
        fontFace: 'Segoe UI',
      });

      if (slideItem.rightBullets && slideItem.rightBullets.length > 0) {
        const bulletObjects = slideItem.rightBullets.map((b) => ({
          text: b,
          options: {
            fontSize: 11.5,
            color: COLOR_TEXT_LIGHT,
            bullet: true,
            spaceAfter: 10,
            fontFace: 'Segoe UI',
          },
        }));

        slide.addText(bulletObjects, {
          x: 7.133,
          y: startY + 0.8,
          w: colWidth - 0.6,
          h: colHeight - 1.0,
          valign: 'top' as const,
          wrap: true,
        });
      }
      return;
    }

    // =========================================================================
    // LAYOUT 3: CARDS / BENEFIT TILES (4-Up High Impact Cards)
    // =========================================================================
    if (slideItem.layout === 'cards' && slideItem.cards && slideItem.cards.length > 0) {
      const cards = slideItem.cards.slice(0, 4);
      const cardWidth = 2.75;
      const cardHeight = 4.75;
      const gap = 0.244;
      const startY = 1.85;

      cards.forEach((card, i) => {
        const cardX = 0.8 + i * (cardWidth + gap);

        // Card Container
        slide.addShape(pptx.ShapeType.roundRect, {
          x: cardX,
          y: startY,
          w: cardWidth,
          h: cardHeight,
          fill: { color: COLOR_CARD_BG },
          line: { color: COLOR_BORDER, width: 1 },
          rectRadius: 0.15,
        });

        // Number Pill (Advansys Navy + Emerald text)
        slide.addShape(pptx.ShapeType.roundRect, {
          x: cardX + 0.22,
          y: startY + 0.25,
          w: 0.7,
          h: 0.45,
          fill: { color: COLOR_PRIMARY },
          line: { color: COLOR_ACCENT, width: 1 },
          rectRadius: 0.08,
        });

        slide.addText(`0${i + 1}`, {
          x: cardX + 0.22,
          y: startY + 0.25,
          w: 0.7,
          h: 0.45,
          fontSize: 11,
          bold: true,
          color: COLOR_ACCENT,
          align: 'center',
          valign: 'middle',
          fontFace: 'Segoe UI',
        });

        // Card Title
        slide.addText(card.title, {
          x: cardX + 0.22,
          y: startY + 0.85,
          w: cardWidth - 0.44,
          h: 0.75,
          fontSize: 13,
          bold: true,
          color: COLOR_WHITE,
          fontFace: 'Segoe UI',
          wrap: true,
        });

        // Card Description
        slide.addText(card.description, {
          x: cardX + 0.22,
          y: startY + 1.65,
          w: cardWidth - 0.44,
          h: 2.8,
          fontSize: 10.5,
          color: COLOR_TEXT_MUTED,
          fontFace: 'Segoe UI',
          wrap: true,
          lineSpacingMultiple: 1.15,
        });
      });
      return;
    }

    // =========================================================================
    // LAYOUT 4: PROCESS FLOW / STEPS (Pasos Operativos con flechas)
    // =========================================================================
    if (slideItem.layout === 'steps' && slideItem.steps && slideItem.steps.length > 0) {
      const steps = slideItem.steps.slice(0, 4);
      const stepWidth = 2.75;
      const stepHeight = 4.75;
      const gap = 0.244;
      const startY = 1.85;

      steps.forEach((step, i) => {
        const stepX = 0.8 + i * (stepWidth + gap);

        // Step Card Container
        slide.addShape(pptx.ShapeType.roundRect, {
          x: stepX,
          y: startY,
          w: stepWidth,
          h: stepHeight,
          fill: { color: COLOR_CARD_BG },
          line: { color: COLOR_BORDER, width: 1 },
          rectRadius: 0.15,
        });

        // Step Number Badge (Emerald Green pill with dark slate text)
        slide.addShape(pptx.ShapeType.roundRect, {
          x: stepX + 0.22,
          y: startY + 0.25,
          w: 0.7,
          h: 0.45,
          fill: { color: COLOR_ACCENT },
          line: { color: COLOR_ACCENT, width: 0 },
          rectRadius: 0.08,
        });

        slide.addText(`0${step.stepNumber || i + 1}`, {
          x: stepX + 0.22,
          y: startY + 0.25,
          w: 0.7,
          h: 0.45,
          fontSize: 11,
          bold: true,
          color: '0F172A',
          align: 'center',
          valign: 'middle',
          fontFace: 'Segoe UI',
        });

        // Step Title
        slide.addText(step.title, {
          x: stepX + 0.22,
          y: startY + 0.85,
          w: stepWidth - 0.44,
          h: 0.75,
          fontSize: 13,
          bold: true,
          color: COLOR_WHITE,
          fontFace: 'Segoe UI',
          wrap: true,
        });

        // Step Description
        slide.addText(step.description, {
          x: stepX + 0.22,
          y: startY + 1.65,
          w: stepWidth - 0.44,
          h: 2.8,
          fontSize: 10.5,
          color: COLOR_TEXT_MUTED,
          fontFace: 'Segoe UI',
          wrap: true,
          lineSpacingMultiple: 1.15,
        });
      });
      return;
    }

    // =========================================================================
    // LAYOUT 5: IMAGE + TEXT (Arquitectura Técnica / Diagramas)
    // =========================================================================
    if (slideItem.layout === 'image-text' || slideItem.imageRef) {
      const targetImg = slideItem.imageRef ? imageMap.get(slideItem.imageRef) : images[0];
      const startY = 1.85;

      // Left Column Text Box
      const leftColWidth = targetImg ? 5.7 : 11.733;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: startY,
        w: leftColWidth,
        h: 4.8,
        fill: { color: COLOR_CARD_BG },
        line: { color: COLOR_BORDER, width: 1 },
        rectRadius: 0.15,
      });

      if (slideItem.bullets && slideItem.bullets.length > 0) {
        const bulletObjects = slideItem.bullets.map((b) => ({
          text: b,
          options: {
            fontSize: 11.5,
            color: COLOR_TEXT_LIGHT,
            bullet: true,
            spaceAfter: 12,
            fontFace: 'Segoe UI',
          },
        }));

        slide.addText(bulletObjects, {
          x: 1.1,
          y: startY + 0.4,
          w: leftColWidth - 0.6,
          h: 4.0,
          valign: 'top' as const,
          wrap: true,
        });
      }

      // Right Column Image Frame (if image exists)
      if (targetImg && targetImg.dataUrl) {
        // Dark background frame
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 6.833,
          y: startY,
          w: 5.7,
          h: 4.8,
          fill: { color: COLOR_INNER_BG },
          line: { color: COLOR_BORDER, width: 1 },
          rectRadius: 0.15,
        });

        slide.addImage({
          data: targetImg.dataUrl,
          x: 7.0,
          y: startY + 0.15,
          w: 5.366,
          h: 4.5,
          sizing: { type: 'contain', w: 5.366, h: 4.5 },
        });
      }
      return;
    }

    // =========================================================================
    // LAYOUT 6: CONCLUSION / SIGUIENTES PASOS
    // =========================================================================
    if (slideItem.layout === 'conclusion') {
      const startY = 1.85;

      // Centered Card Container
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.8,
        y: startY,
        w: 9.733,
        h: 4.8,
        fill: { color: COLOR_CARD_BG },
        line: { color: COLOR_ACCENT, width: 1.5 },
        rectRadius: 0.2,
      });

      // Top Checkmark Badge
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.166,
        y: startY + 0.3,
        w: 1.0,
        h: 0.48,
        fill: { color: '064E3B' },
        line: { color: COLOR_ACCENT, width: 1 },
        rectRadius: 0.1,
      });

      slide.addText('✓', {
        x: 6.166,
        y: startY + 0.3,
        w: 1.0,
        h: 0.48,
        fontSize: 16,
        bold: true,
        color: COLOR_ACCENT,
        align: 'center',
        valign: 'middle',
      });

      // Conclusion Title
      slide.addText(slideItem.title, {
        x: 2.2,
        y: startY + 0.9,
        w: 8.933,
        h: 0.6,
        fontSize: 18,
        bold: true,
        color: COLOR_WHITE,
        align: 'center',
        fontFace: 'Segoe UI',
      });

      // Action Item Strips
      if (slideItem.bullets && slideItem.bullets.length > 0) {
        const items = slideItem.bullets.slice(0, 4);
        const itemH = 0.65;
        const gap = 0.15;
        const listStartY = startY + 1.6;

        items.forEach((item, i) => {
          const itemY = listStartY + i * (itemH + gap);

          // Strip box
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 2.4,
            y: itemY,
            w: 8.533,
            h: itemH,
            fill: { color: '0F172A' },
            line: { color: COLOR_BORDER, width: 1 },
            rectRadius: 0.1,
          });

          // Number badge
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 2.55,
            y: itemY + 0.12,
            w: 0.42,
            h: 0.42,
            fill: { color: COLOR_ACCENT },
            rectRadius: 0.08,
          });

          slide.addText(`${i + 1}`, {
            x: 2.55,
            y: itemY + 0.12,
            w: 0.42,
            h: 0.42,
            fontSize: 10,
            bold: true,
            color: '0F172A',
            align: 'center',
            valign: 'middle',
          });

          // Text
          slide.addText(item, {
            x: 3.15,
            y: itemY + 0.08,
            w: 7.5,
            h: 0.5,
            fontSize: 11.5,
            color: COLOR_TEXT_LIGHT,
            fontFace: 'Segoe UI',
            valign: 'middle',
            wrap: true,
          });
        });
      }
      return;
    }

    // =========================================================================
    // LAYOUT 7: DEFAULT / BULLETS (Sleek Horizontal Card Strips)
    // =========================================================================
    const bullets = slideItem.bullets || [];
    const count = Math.min(bullets.length, 5);
    const startY = 1.85;

    if (count > 0) {
      const itemHeight = Math.min(0.85, (4.6 - (count - 1) * 0.15) / count);
      const gap = 0.15;

      bullets.slice(0, 5).forEach((bulletText, i) => {
        const itemY = startY + i * (itemHeight + gap);

        // Strip container
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: itemY,
          w: 11.733,
          h: itemHeight,
          fill: { color: COLOR_CARD_BG },
          line: { color: COLOR_BORDER, width: 1 },
          rectRadius: 0.12,
        });

        // Emerald indicator circle
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 1.1,
          y: itemY + (itemHeight - 0.24) / 2,
          w: 0.24,
          h: 0.24,
          fill: { color: COLOR_ACCENT },
          rectRadius: 0.12,
        });

        // Text
        slide.addText(bulletText, {
          x: 1.5,
          y: itemY + 0.08,
          w: 10.7,
          h: itemHeight - 0.16,
          fontSize: 12,
          color: COLOR_TEXT_LIGHT,
          fontFace: 'Segoe UI',
          valign: 'middle',
          wrap: true,
        });
      });
    } else {
      // Fallback empty box
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: startY,
        w: 11.733,
        h: 4.8,
        fill: { color: COLOR_CARD_BG },
        line: { color: COLOR_BORDER, width: 1 },
        rectRadius: 0.15,
      });

      slide.addText('Sin contenido especificado en esta diapositiva.', {
        x: 1.2,
        y: startY + 1.0,
        w: 10.933,
        h: 1.0,
        fontSize: 13,
        color: COLOR_TEXT_MUTED,
        align: 'center',
        valign: 'middle',
      });
    }
  });

  const blob = (await pptx.write({ outputType: 'blob' })) as Blob;
  return blob;
}

import {
	AlignmentType,
	// convertInchesToTwip,
	Document,
	Packer,
	Paragraph,
	TextRun,
	// UnderlineType,
	// Table,
	// TableCell,
	// TableRow,
	// ExternalHyperlink,
	ImageRun,
	BorderStyle,
	ShadingType,
	// VerticalAlign,
	// PageBreak,
	PageNumber,
	NumberFormat,
	Footer,
	// WidthType
} from 'docx';
import FileSaver from 'file-saver';
const saveAs = FileSaver.saveAs || FileSaver;
import { Buffer } from 'buffer';

const DISCLAIMER = "Disclaimer: This document is auto-generated.";
const CREATOR = "MD Timeline Blog";
const WORD_DESCRIPTION = "Exported blog post";

type VariableType = {
	name: string;
	default?: string;
};

const getBase64FromUrl = async (url: string) => {
	try {
		const data = await fetch(url);
		const blob = await data.blob();
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.readAsDataURL(blob);
			reader.onloadend = () => {
				const base64data = reader.result;
				resolve(base64data);
			};
		});
	} catch (e) {
		console.error("Error fetching image for base64:", url, e);
		return null;
	}
};

const getMetadataString = () => {
	const url = window.location.href;
	const timestamp = new Date().toLocaleString();
	return `Downloaded from: ${url}\nTime: ${timestamp}`;
};

export const downloadPdf = async (title: string, content: string) => {
	const printWindow = window.open('', '', 'height=600,width=800');
	if (!printWindow) return;

	const metadata = getMetadataString().replace(/\n/g, '<br>');
	const metadataHtml = `<div style="font-size: 0.8em; color: #666; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">${metadata}</div>`;
	const metadataFooterHtml = `<div style="font-size: 0.8em; color: #666; margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem;">${metadata}</div>`;

	printWindow.document.write(`<html><head><title>${title}</title>`);
	printWindow.document.write(`
		<style>
			body { font-family: serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
			img, svg { max-width: 100%; height: auto; }
			svg { display: block; }
			h1, h2, h3, h4, h5, h6 { font-family: sans-serif; margin-top: 1.5em; margin-bottom: 0.5em; }
			h1 { font-size: 2.5em; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
			p { margin-bottom: 1em; }
			code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
			pre { background: #f4f4f4; padding: 1em; overflow-x: auto; border-radius: 5px; }
			blockquote { border-left: 4px solid #ccc; padding-left: 1em; color: #666; }
			table { width: 100%; border-collapse: collapse; margin: 1em 0; }
			th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
			th { background-color: #f2f2f2; }
			.media-blocked {
				margin: 2rem 0;
				padding: 1.5rem;
				background: #fff;
				border: 2px solid #e5e7eb;
				border-radius: 8px;
				box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
				display: block;
			}
			@media print {
				@page { margin: 2cm; }
				body { padding: 0; }
				svg { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
			}
		</style>
	`);
	printWindow.document.write('</head><body>');
	printWindow.document.write(metadataHtml);
	printWindow.document.write(content);
	printWindow.document.write(metadataFooterHtml);
	printWindow.document.write('</body></html>');
	printWindow.document.close();
	// Wait for images to load before printing
	setTimeout(() => {
		printWindow.print();
	}, 500);
};

export const downloadWord = async (path: string, variables: VariableType[] | undefined = undefined) => {
	// Assumes path is relative to docs/ e.g. "posts/slug.md"

	// Ensure docx library and Buffer are available
	try {
		if (!Buffer || !Document || !Packer) {
			throw new Error('Required libraries not loaded');
		}
	} catch (error) {
		console.error('Word export dependencies not ready:', error);
		alert('Word export is initializing. Please try again in a moment.');
		return;
	}

	const images = document.getElementsByTagName('img');
	let imageIndex = 0;
	const ratio = 0.7;

	const globs = import.meta.glob('../../docs/**/*.{md,svx,json}', { query: '?raw', import: 'default' });
	const globKey = `../../docs/${path}`;

	let imported: any;
	try {
		if (globs[globKey]) {
			imported = await globs[globKey]();
		} else {
			console.error('File not found in glob:', globKey);
			alert('Could not find source file for export.');
			return;
		}
	} catch (e) {
		console.error('Error loading markdown for Word export:', e);
		alert('Error loading content. Please try again.');
		return;
	}

	if (typeof imported !== 'string') {
		console.error('Imported content is not a string.', imported);
		return;
	}
	console.log('Markdown content loaded for Word export.', imported.substring(0, 500) + '...'); // Log first 500 chars

	// Strip out all animated SVG code and other potential problematic HTML
	const originalImported = imported; // Keep original for comparison
	imported = imported
		.replace(/<animate[\s\S]*?>.*?<\/animate>/gi, '') // Remove animate blocks with content
		.replace(/<animate[^>]*>/gi, '') // Remove self-closing animate tags
		.replace(/<animateTransform[^>]*>/gi, '')
		.replace(/<animateMotion[^>]*>/gi, '')
		.replace(/<set[^>]*>/gi, '') // SVG set tag
		.replace(/<mpath[^>]*>/gi, '');

	if (originalImported !== imported) {
		console.log('SVG animation tags stripped for Word export.');
	} else {
		console.log('No SVG animation tags found or stripped.');
	}

	if (variables && variables.length > 0) {
		variables.forEach((variable: VariableType) => {
			if (variable.default) {
				imported = imported.replace(new RegExp(`\[${variable.name}\]`, 'g'), variable.default);
			}
		});
	}

	const fileName = (path.split('/').pop()?.replace(/\.md$/, '') || 'document') + '.docx';
	console.log('Saving ' + fileName + ' as docx');
	
	const lines = imported.split('\n');

	let title = 'Blog Post';
	let paragraph = '';
	let sectionStartIndex = -1;

	const children: Array<any> = [];
	
	// Skip frontmatter
	if (lines[0].trim() === '---') {
		sectionStartIndex = lines.findIndex(
			(el: string, index: number) => el.trim() === '---' && index > 0
		);
		// Parse title from frontmatter
		for(let i=1; i<sectionStartIndex; i++) {
			if(lines[i].startsWith('title:')) {
				title = lines[i].replace('title:', '').trim().replace(/^["']|["']$/g, '');
			}
		}
	}

	const formatedText: any = (text: string) => {
		if (!text) return [];

		// Header handling within text (rare but possible in recursion)
		if (text.startsWith('# ') && !text.startsWith('## ')) {
			return [new TextRun({ text: text.substring(2), size: 40, bold: true })];
		}
		if (text.startsWith('## ')) {
			return [new TextRun({ text: text.substring(3), size: 32, bold: true })];
		}
		if (text.startsWith('### ')) {
			return [new TextRun({ text: text.substring(4), size: 28, bold: true })];
		}

		// Simple Bold/Italic parser
		// Splitting by ** for bold
		const parts = text.split(/(\$\*[^*]+\*\*|_|`[^`]+`)/g);
		const runs: any[] = [];

		parts.forEach(part => {
			if (part.startsWith('**') && part.endsWith('**')) {
				runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
			} else if (part.startsWith('_') && part.endsWith('_')) {
				runs.push(new TextRun({ text: part.slice(1, -1), italics: true }));
			} else if (part.startsWith('`') && part.endsWith('`')) {
				runs.push(new TextRun({ text: part.slice(1, -1), font: 'Courier New' }));
			} else if (part.includes('](')) {
				// Simple link parser: [text](url)
				// This is a naive parser and only handles one link per segment effectively if not recursing properly
				// For robustness, we just strip the link syntax and show text
				const linkMatch = part.match(/[\\[\\]\(]([^\\\\]\[\)]+)[\(]([^)]+)[\)]/);
				if (linkMatch) {
					runs.push(new TextRun({ text: linkMatch[1], style: 'Hyperlink' }));
				} else {
					runs.push(new TextRun({ text: part }));
				}
			} else {
				runs.push(new TextRun({ text: part }));
			}
		});
		return runs;
	};

	// Add Metadata at the start
	const url = window.location.href;
	const timestamp = new Date().toLocaleString();
	children.push(
		new Paragraph({
			children: [
				new TextRun({ text: `Downloaded from: ${url}`, size: 16, color: '666666' }),
			]
		}),
		new Paragraph({
			children: [
				new TextRun({ text: `Time: ${timestamp}`, size: 16, color: '666666' })
			],
			border: {
				bottom: { color: 'EEEEEE', space: 1, style: BorderStyle.SINGLE, size: 6 }
			},
			spacing: { after: 240 }
		})
	);

	children.push(
		new Paragraph({
			text: DISCLAIMER.toUpperCase(),
			border: {
				bottom: { color: 'auto', space: 1, style: BorderStyle.SINGLE, size: 6 }
			},
			shading: { type: ShadingType.CLEAR, fill: 'EFEFEF' }
		}),
		new Paragraph('')
	);
	
	children.push(new Paragraph({
		children: [new TextRun({ text: title, size: 48, bold: true })],
		spacing: { after: 400 }
	}));

	let inSvgBlock = false;
	let svgBlockDetected = false;

	for (const [index, line] of lines.entries()) {
		if (index <= sectionStartIndex) continue;

		// Detect SVG block start
		if (line.includes('<svg')) {
			inSvgBlock = true;
			svgBlockDetected = true;
			// Add a placeholder for SVG content
			children.push(new Paragraph({
				children: [new TextRun({
					text: '[SVG Chart/Graphic - View in web browser or PDF export]',
					italics: true,
					color: '666666',
					size: 20
				})],
				spacing: { before: 120, after: 120 },
				indent: { left: 360 }
			}));
			continue;
		}

		// Skip lines while in SVG block
		if (inSvgBlock) {
			if (line.includes('</svg>')) {
				inSvgBlock = false;
			}
			continue;
		}

		// Skip HTML div tags (used for media containers)
		if (line.trim().startsWith('<div') || line.trim().startsWith('</div>')) {
			continue;
		}

		if (line.trim() === '') {
			children.push(new Paragraph(''));
			continue;
		}

		// Headers
		if (line.startsWith('# ')) {
			children.push(new Paragraph({
				children: [new TextRun({ text: line.substring(2), size: 32, bold: true })],
				spacing: { before: 240, after: 120 }
			}));
		} else if (line.startsWith('## ')) {
			children.push(new Paragraph({
				children: [new TextRun({ text: line.substring(3), size: 28, bold: true })],
				spacing: { before: 240, after: 120 }
			}));
		} else if (line.startsWith('### ')) {
			children.push(new Paragraph({
				children: [new TextRun({ text: line.substring(4), size: 24, bold: true })],
				spacing: { before: 240, after: 120 }
			}));
		}
		// Images ![]()
		else if (line.includes('![](') || (line.includes('<img') && line.includes('src='))) {
			// Try to get the image from the DOM since we have the rendered page open
			// This matches the source strategy
			if (imageIndex < images.length) {
				const img = images[imageIndex];
				imageIndex++;
				
				// Fetch base64
				try {
					const base64 = await getBase64FromUrl(img.src);
					if (base64 && typeof base64 === 'string') {
						const parts = base64.split(',');
						const mime = parts[0].split(':')[1].split(';')[0];
						const data = parts[1];
						const width = img.naturalWidth || 500;
						const height = img.naturalHeight || 300;
						
						// Cap width for Word
						const maxWidth = 500;
						const scale = width > maxWidth ? maxWidth / width : 1;

						// Map mime to docx type
						let imgType: "png" | "jpg" | "gif" | "bmp" = "png";
						if (mime.includes('jpeg') || mime.includes('jpg')) imgType = "jpg";
						else if (mime.includes('gif')) imgType = "gif";
						else if (mime.includes('bmp')) imgType = "bmp";
						else if (mime.includes('svg')) return; // Skip SVGs

						children.push(new Paragraph({
							children: [
								new ImageRun({
									data: Buffer.from(data, 'base64'),
									transformation: {
										width: width * scale,
										height: height * scale
									},
								type: imgType
								})
							],
						alignment: AlignmentType.CENTER
						}));
					}
				} catch (e) {
					console.warn('Failed to embed image', e);
				}
			}
		}
		// List items
		else if (line.trim().startsWith('- ')) {
			children.push(new Paragraph({
				children: formatedText(line.trim().substring(2)),
				bullet: { level: 0 }
			}));
		}
		// Blockquote
		else if (line.trim().startsWith('> ')) {
			children.push(new Paragraph({
				children: formatedText(line.trim().substring(2)),
				indent: { left: 720 }, // 0.5 inch
				style: 'Quote' 
			}));
		}
		// Normal paragraph
		else {
			children.push(new Paragraph({
				children: formatedText(line),
				spacing: { after: 120 }
			}));
		}
	}

	// Add Metadata at the end
	children.push(
		new Paragraph({
			children: [
				new TextRun({ text: `Downloaded from: ${url}`, size: 16, color: '666666' }),
			],
			spacing: { before: 480 }
		}),
		new Paragraph({
			children: [
				new TextRun({ text: `Time: ${timestamp}`, size: 16, color: '666666' })
			],
			border: {
				top: { color: 'EEEEEE', space: 1, style: BorderStyle.SINGLE, size: 6 }
			}
		})
	);

	const doc = new Document({
		creator: CREATOR,
		title: title,
		description: WORD_DESCRIPTION,
		sections: [
			{
				properties: {
					page: {
						pageNumbers: {
							start: 1,
							formatType: NumberFormat.DECIMAL
						}
					}
				},
				children: children,
				footers: {
					default: new Footer({
						children: [
							new Paragraph({
								alignment: AlignmentType.CENTER,
								children: [
									new TextRun({
										children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES]
									})
							]
						})
						]
					})
				}
			}
		]
	});

	try {
		console.log('Attempting to generate Word document blob.');
		const blob = await Packer.toBlob(doc);
		saveAs(blob, fileName);
		console.log('Document created successfully');
	} catch(e) {
		console.error("Error creating docx blob or saving file:", e);
		// Log more details if 'e' is an object with a message or stack
		if (e instanceof Error) {
			console.error('Error message:', e.message);
			console.error('Error stack:', e.stack);
		} else if (typeof e === 'object' && e !== null && 'message' in e) {
			console.error('Error object:', e);
		}
	}
};

export const downloadMd = async (path: string) => {
	const globs = import.meta.glob('../../docs/**/*.{md,svx,json}', { query: '?raw', import: 'default' });
	const globKey = `../../docs/${path}`;

	let imported: any;
	try {
		if (globs[globKey]) {
			imported = await globs[globKey]();
		} else {
			console.error('File not found', globKey);
			alert('Could not find source file.');
			return;
		}
	} catch (e) {
		console.log(e);
		return;
	}

	if (!imported) return;

	const metadata = getMetadataString();
	const contentWithMetadata = `${metadata}\n\n${imported}\n\n${metadata}`;

	const fileName = path.split('/').pop();
	const blob = new Blob([contentWithMetadata], { type: 'text/markdown;charset=utf-8' });
	saveAs(blob, fileName);
};
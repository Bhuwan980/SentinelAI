"""
Enhanced DMCA PDF Report Generator
Creates professional, detailed PDF reports with all scraped metadata
"""

import logging
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime
from typing import Dict, Any, Optional
import os
import tempfile
import requests
from io import BytesIO

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def generate_dmca_pdf(report: Any, output_path: Optional[str] = None) -> str:
    """
    Generate a comprehensive DMCA takedown notice PDF.
    
    Args:
        report: DmcaReports model instance
        output_path: Optional path for output file. If None, creates temp file.
        
    Returns:
        Path to generated PDF file
    """
    try:
        # Create output path if not provided
        if not output_path:
            output_path = os.path.join(tempfile.gettempdir(), f"dmca_report_{report.id}.pdf")
        
        # Create PDF document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )
        
        # Container for PDF elements
        story = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#059669'),  # Emerald
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#047857'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontSize=11,
            spaceAfter=12,
            alignment=TA_JUSTIFY
        )
        
        # ========== HEADER ==========
        story.append(Paragraph("DMCA TAKEDOWN NOTICE", title_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # Report info table
        report_info = [
            ['Report ID:', str(report.id)],
            ['Date Issued:', report.created_at.strftime('%B %d, %Y at %I:%M %p')],
            ['Status:', report.status.upper()],
            ['Issued By:', f'User ID: {report.user_id}'],
        ]
        
        report_table = Table(report_info, colWidths=[2*inch, 4*inch])
        report_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0FDF4')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(report_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # ========== LEGAL STATEMENT ==========
        story.append(Paragraph("NOTICE OF COPYRIGHT INFRINGEMENT", heading_style))
        legal_text = """
        This is an official notification under the Digital Millennium Copyright Act (DMCA), 
        17 U.S.C. § 512, to inform you of copyrighted material that is being infringed upon 
        through your service. This notice constitutes a good faith assertion that use of the 
        material in the manner complained of is not authorized by the copyright owner, its agent, 
        or the law.
        """
        story.append(Paragraph(legal_text, body_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # ========== ORIGINAL WORK INFORMATION ==========
        story.append(Paragraph("1. ORIGINAL COPYRIGHTED WORK", heading_style))
        
        original_info = [
            ['Original Image URL:', report.original_image_url or 'N/A'],
            ['Caption:', report.image_caption or 'No caption provided'],
        ]
        
        original_table = Table(original_info, colWidths=[2*inch, 4*inch])
        original_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0FDF4')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(original_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # ========== INFRINGING CONTENT ==========
        story.append(Paragraph("2. INFRINGING CONTENT LOCATION", heading_style))
        
        infringing_info = [
            ['Infringing URL:', report.infringing_url or 'N/A'],
            ['Screenshot Evidence:', report.screenshot_url or 'N/A'],
            ['Similarity Score:', f"{float(report.similarity_score or 0):.2%}"],
        ]
        
        infringing_table = Table(infringing_info, colWidths=[2*inch, 4*inch])
        infringing_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#FEF2F2')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(infringing_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # ========== DETAILED PAGE METADATA ==========
        if report.page_metadata:
            story.append(Paragraph("3. DETAILED METADATA OF INFRINGING PAGE", heading_style))
            
            metadata_items = []
            
            # Page Title
            if report.page_title:
                metadata_items.append(['Page Title:', _truncate(report.page_title, 80)])
            
            # Author
            if report.page_author:
                metadata_items.append(['Author/Publisher:', report.page_author])
            
            # Domain
            if report.page_metadata.get('domain'):
                metadata_items.append(['Domain:', report.page_metadata['domain']])
            
            # Description
            if report.page_description:
                metadata_items.append(['Page Description:', _truncate(report.page_description, 150)])
            
            # Copyright Info
            if report.page_copyright:
                metadata_items.append(['Copyright Notice:', report.page_copyright])
            
            # Image Alt Text
            if report.suspected_image_alt:
                metadata_items.append(['Image Alt Text:', _truncate(report.suspected_image_alt, 100)])
            
            # Image Title
            if report.suspected_image_title:
                metadata_items.append(['Image Title:', _truncate(report.suspected_image_title, 100)])
            
            # Tags
            if report.page_tags:
                tags_str = ', '.join(report.page_tags[:15])  # Show first 15 tags
                metadata_items.append(['Tags/Keywords:', _truncate(tags_str, 150)])
            
            # Open Graph Data
            og_data = report.page_metadata.get('og_data', {})
            if og_data:
                if og_data.get('site_name'):
                    metadata_items.append(['Site Name:', og_data['site_name']])
                if og_data.get('type'):
                    metadata_items.append(['Content Type:', og_data['type']])
            
            # Schema.org Type
            schema_data = report.page_metadata.get('schema_data', {})
            if schema_data.get('@type'):
                metadata_items.append(['Schema Type:', schema_data['@type']])
            
            if metadata_items:
                metadata_table = Table(metadata_items, colWidths=[2*inch, 4*inch])
                metadata_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#FFFBEB')),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ]))
                story.append(metadata_table)
            else:
                story.append(Paragraph("No detailed metadata available.", body_style))
            
            story.append(Spacer(1, 0.3 * inch))
        
        # ========== REQUIRED ACTIONS ==========
        story.append(Paragraph("4. REQUIRED ACTIONS", heading_style))
        actions_text = """
        Under the DMCA, you are required to:
        <br/>
        1. Remove or disable access to the infringing material identified above<br/>
        2. Notify the alleged infringer of this takedown notice<br/>
        3. Take reasonable steps to expeditiously remove or disable access to the material<br/>
        4. Preserve any evidence related to the infringement for potential legal proceedings
        """
        story.append(Paragraph(actions_text, body_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # ========== GOOD FAITH STATEMENT ==========
        story.append(Paragraph("5. GOOD FAITH STATEMENT", heading_style))
        faith_text = """
        I have a good faith belief that use of the copyrighted materials described above as 
        allegedly infringing is not authorized by the copyright owner, its agent, or the law. 
        I swear, under penalty of perjury, that the information in this notification is accurate 
        and that I am the copyright owner or am authorized to act on behalf of the owner of an 
        exclusive right that is allegedly infringed.
        """
        story.append(Paragraph(faith_text, body_style))
        story.append(Spacer(1, 0.3 * inch))
        
        # ========== CONTACT INFORMATION ==========
        story.append(Paragraph("6. CONTACT INFORMATION", heading_style))
        contact_text = """
        For questions or concerns regarding this notice, please contact:<br/>
        <br/>
        <b>SentinelAI DMCA Agent</b><br/>
        Email: dmca@sentinelai.com<br/>
        Phone: +1 (555) 911-9111<br/>
        """
        story.append(Paragraph(contact_text, body_style))
        story.append(Spacer(1, 0.3 * inch))
        
        # ========== FOOTER ==========
        footer_text = f"""
        <br/><br/>
        ---<br/>
        This document was automatically generated by SentinelAI's copyright protection system.<br/>
        Report ID: {report.id} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}<br/>
        <br/>
        <i>This notice is issued in compliance with the Digital Millennium Copyright Act (DMCA), 
        17 U.S.C. § 512(c)(3), and constitutes a formal request for removal of infringing content.</i>
        """
        
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph(footer_text, footer_style))
        
        # Build PDF
        doc.build(story)
        
        logger.info(f"✅ Generated DMCA PDF report: {output_path}")
        return output_path
        
    except Exception as e:
        logger.exception(f"❌ Failed to generate DMCA PDF for report {report.id}")
        raise


def _truncate(text: str, max_length: int) -> str:
    """Truncate text to max length with ellipsis."""
    if not text:
        return "N/A"
    text = str(text).strip()
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def _wrap_text(text: str, max_width: int = 60) -> str:
    """Wrap text to fit within max width."""
    if not text:
        return "N/A"
    text = str(text)
    if len(text) <= max_width:
        return text
    
    words = text.split()
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        if current_length + len(word) + 1 <= max_width:
            current_line.append(word)
            current_length += len(word) + 1
        else:
            lines.append(' '.join(current_line))
            current_line = [word]
            current_length = len(word)
    
    if current_line:
        lines.append(' '.join(current_line))
    
    return '\n'.join(lines)


def generate_dmca_html_preview(report: Any) -> str:
    """
    Generate HTML preview of DMCA report for web display.
    
    Args:
        report: DmcaReports model instance
        
    Returns:
        HTML string
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>DMCA Report #{report.id}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 40px auto;
                padding: 20px;
                background: #f9fafb;
            }}
            .header {{
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 30px;
            }}
            .section {{
                background: white;
                padding: 25px;
                margin-bottom: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            h2 {{
                color: #047857;
                border-bottom: 2px solid #059669;
                padding-bottom: 10px;
            }}
            .info-table {{
                width: 100%;
                border-collapse: collapse;
            }}
            .info-table td {{
                padding: 10px;
                border: 1px solid #e5e7eb;
            }}
            .info-table td:first-child {{
                background: #f0fdf4;
                font-weight: bold;
                width: 30%;
            }}
            .metadata {{
                background: #fffbeb;
                padding: 15px;
                border-left: 4px solid #f59e0b;
                margin: 10px 0;
            }}
            .footer {{
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                margin-top: 40px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>DMCA TAKEDOWN NOTICE</h1>
            <p>Report ID: {report.id} | Status: {report.status.upper()}</p>
        </div>
        
        <div class="section">
            <h2>1. Original Copyrighted Work</h2>
            <table class="info-table">
                <tr>
                    <td>Original Image URL</td>
                    <td>{report.original_image_url or 'N/A'}</td>
                </tr>
                <tr>
                    <td>Caption</td>
                    <td>{report.image_caption or 'No caption'}</td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <h2>2. Infringing Content</h2>
            <table class="info-table">
                <tr>
                    <td>Infringing URL</td>
                    <td><a href="{report.infringing_url}">{report.infringing_url}</a></td>
                </tr>
                <tr>
                    <td>Similarity Score</td>
                    <td>{float(report.similarity_score or 0):.2%}</td>
                </tr>
            </table>
        </div>
        
        {''.join([f'''
        <div class="section">
            <h2>3. Page Metadata</h2>
            <div class="metadata">
                <p><strong>Page Title:</strong> {report.page_title or 'N/A'}</p>
                <p><strong>Author:</strong> {report.page_author or 'N/A'}</p>
                <p><strong>Description:</strong> {_truncate(report.page_description or 'N/A', 200)}</p>
                <p><strong>Copyright:</strong> {report.page_copyright or 'N/A'}</p>
                <p><strong>Tags:</strong> {', '.join(report.page_tags[:10]) if report.page_tags else 'N/A'}</p>
                <p><strong>Image Alt:</strong> {report.suspected_image_alt or 'N/A'}</p>
            </div>
        </div>
        ''' if report.page_metadata else ''])}
        
        <div class="footer">
            <p>Generated by SentinelAI | {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
            <p>This document is issued under the DMCA, 17 U.S.C. § 512(c)(3)</p>
        </div>
    </body>
    </html>
    """
    return html
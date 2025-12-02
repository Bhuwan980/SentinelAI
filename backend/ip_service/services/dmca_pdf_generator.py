"""
Professional DMCA PDF Report Generator - Legally Compliant Version
Creates court-ready PDF reports with comprehensive metadata and proper legal formatting
Version: 2.0 - Production Ready for MVP
Updated: 2025-01-20

Features:
- Complete user information (not just ID)
- Clickable links with short display text
- Professional legal formatting
- Court-ready documentation
- Comprehensive evidence presentation
"""

import logging
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, KeepTogether, HRFlowable, Image as RLImage
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from datetime import datetime
from typing import Any, Optional
import os
import tempfile
from urllib.parse import urlparse

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def truncate_url_for_display(url: str, max_length: int = 50) -> str:
    """
    Truncate URL for display while keeping it recognizable.
    Example: https://example.com/very/long/path/to/image.jpg -> example.com/...image.jpg
    """
    if not url or len(url) <= max_length:
        return url or "N/A"
    
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or "unknown"
        path_parts = parsed.path.split('/')
        filename = path_parts[-1] if path_parts else ""
        
        if len(filename) > 30:
            filename = filename[:27] + "..."
        
        return f"{domain}/.../{filename}"
    except:
        # Fallback: simple truncation
        return url[:max_length-3] + "..."


def create_clickable_link(url: str, display_text: str = None) -> str:
    """
    Create a clickable link with short display text for PDF.
    Returns: HTML-like link that reportlab can render
    """
    if not url:
        return "N/A"
    
    # Use custom display text or truncate URL
    if not display_text:
        display_text = truncate_url_for_display(url, 60)
    
    # Return link in reportlab format
    return f'<link href="{url}" color="blue"><u>{display_text}</u></link>'


def generate_dmca_pdf(report: Any, output_path: Optional[str] = None) -> str:
    """
    Generate a comprehensive, legally compliant DMCA takedown notice PDF.
    
    Args:
        report: DmcaReports model instance with user relationship loaded
        output_path: Optional path for output file. If None, creates temp file.
        
    Returns:
        Path to generated PDF file
    """
    try:
        # Create output path if not provided
        if not output_path:
            output_path = os.path.join(
                tempfile.gettempdir(), 
                f"dmca_report_{report.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
            )
        
        # Create PDF document with proper margins for legal documents
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=1*inch,
            leftMargin=1*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
        )
        
        # Container for PDF elements
        story = []
        
        # Get styles
        styles = getSampleStyleSheet()
        
        # ===== CUSTOM STYLES =====
        title_style = ParagraphStyle(
            'LegalTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=20,
            spaceBefore=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            leading=24
        )
        
        heading_style = ParagraphStyle(
            'LegalHeading',
            parent=styles['Heading2'],
            fontSize=13,
            textColor=colors.HexColor('#2c5282'),
            spaceAfter=10,
            spaceBefore=15,
            fontName='Helvetica-Bold',
            leading=16,
            borderWidth=1,
            borderColor=colors.HexColor('#2c5282'),
            borderPadding=5,
            backColor=colors.HexColor('#EBF8FF')
        )
        
        subheading_style = ParagraphStyle(
            'Subheading',
            parent=styles['Heading3'],
            fontSize=11,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=8,
            spaceBefore=10,
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'LegalBody',
            parent=styles['BodyText'],
            fontSize=10,
            spaceAfter=10,
            alignment=TA_JUSTIFY,
            leading=14
        )
        
        bold_body_style = ParagraphStyle(
            'BoldBody',
            parent=body_style,
            fontName='Helvetica-Bold'
        )
        
        small_style = ParagraphStyle(
            'SmallText',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#4a5568'),
            leading=12
        )
        
        # ========== HEADER WITH LOGO/BRANDING ==========
        story.append(Spacer(1, 0.2*inch))
        
        # Main Title
        story.append(Paragraph("DMCA TAKEDOWN NOTICE", title_style))
        story.append(Paragraph(
            "Digital Millennium Copyright Act - 17 U.S.C. § 512(c)(3)",
            small_style
        ))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2c5282')))
        story.append(Spacer(1, 0.3*inch))
        
        # ========== REPORT IDENTIFICATION ==========
        report_date = report.created_at or datetime.utcnow()
        report_info_data = [
            ['Report ID:', f"#{report.id}"],
            ['Issue Date:', report_date.strftime('%B %d, %Y at %I:%M %p UTC')],
            ['Status:', (report.status or 'pending').upper()],
            ['Detection Method:', 'Automated Image Recognition System'],
        ]
        
        report_info_table = Table(report_info_data, colWidths=[2*inch, 4*inch])
        report_info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F7FAFC')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(report_info_table)
        story.append(Spacer(1, 0.3*inch))
        
        # ========== COPYRIGHT HOLDER INFORMATION ==========
        story.append(Paragraph("I. COPYRIGHT HOLDER INFORMATION", heading_style))
        story.append(Spacer(1, 0.1*inch))
        
        # Get user information
        user = report.user
        user_data = []
        
        if user:
            # Full name or username
            full_name = user.full_name or user.username or "Not Provided"
            user_data.append(['Full Legal Name:', full_name])
            
            # Email (required)
            user_data.append(['Email Address:', user.email or "Not Provided"])
            
            # Phone (if available)
            if hasattr(user, 'phone_number') and user.phone_number:
                user_data.append(['Phone Number:', user.phone_number])
            
            # Address (if available)
            if hasattr(user, 'address') and user.address:
                user_data.append(['Mailing Address:', user.address])
            elif hasattr(user, 'city') and user.city:
                address_parts = []
                if hasattr(user, 'street_address') and user.street_address:
                    address_parts.append(user.street_address)
                if user.city:
                    address_parts.append(user.city)
                if hasattr(user, 'state') and user.state:
                    address_parts.append(user.state)
                if hasattr(user, 'zip_code') and user.zip_code:
                    address_parts.append(user.zip_code)
                if hasattr(user, 'country') and user.country:
                    address_parts.append(user.country)
                if address_parts:
                    user_data.append(['Mailing Address:', ', '.join(address_parts)])
            
            # User ID (for reference)
            user_data.append(['User ID:', f"#{user.id}"])
        else:
            user_data.append(['Copyright Holder:', f"User ID #{report.user_id}"])
            user_data.append(['Email Address:', "Available upon request"])
        
        user_table = Table(user_data, colWidths=[2*inch, 4*inch])
        user_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#EBF8FF')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(user_table)
        story.append(Spacer(1, 0.1*inch))
        
        # Legal capacity statement
        capacity_text = """
        The above-named individual ("Copyright Holder") is the owner or authorized agent of the 
        copyrighted work described herein and has the legal authority to act on behalf of the 
        copyright owner in this matter.
        """
        story.append(Paragraph(capacity_text, small_style))
        story.append(Spacer(1, 0.3*inch))
        
        # ========== ORIGINAL COPYRIGHTED WORK ==========
        story.append(Paragraph("II. IDENTIFICATION OF COPYRIGHTED WORK", heading_style))
        story.append(Spacer(1, 0.1*inch))
        
        story.append(Paragraph(
            "The Copyright Holder owns the following original copyrighted work:",
            body_style
        ))
        story.append(Spacer(1, 0.1*inch))
        
        original_data = []
        
        # Original image with clickable link
        if report.original_image_url:
            link_text = create_clickable_link(
                report.original_image_url, 
                "View Original Copyrighted Work"
            )
            original_data.append(['Original Work URL:', Paragraph(link_text, body_style)])
        else:
            original_data.append(['Original Work URL:', 'Available upon request'])
        
        # Description/Caption
        if report.image_caption:
            original_data.append(['Description:', report.image_caption])
        
        # Creation date
        original_data.append(['First Published:', report_date.strftime('%B %d, %Y')])
        
        # Copyright registration (if available)
        if hasattr(report, 'copyright_registration') and report.copyright_registration:
            original_data.append(['Copyright Reg. #:', report.copyright_registration])
        
        original_table = Table(original_data, colWidths=[2*inch, 4*inch])
        original_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0FDF4')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(original_table)
        story.append(Spacer(1, 0.3*inch))
        
        # ========== INFRINGING MATERIAL ==========
        story.append(Paragraph("III. IDENTIFICATION OF INFRINGING MATERIAL", heading_style))
        story.append(Spacer(1, 0.1*inch))
        
        story.append(Paragraph(
            "The copyrighted work identified above is being used without authorization at the following location:",
            body_style
        ))
        story.append(Spacer(1, 0.1*inch))
        
        infringing_data = []
        
        # Infringing page URL with clickable link
        if report.infringing_url:
            link_text = create_clickable_link(
                report.infringing_url,
                "View Infringing Content"
            )
            infringing_data.append(['Infringing Page URL:', Paragraph(link_text, body_style)])
            
            # Also show truncated URL for reference
            infringing_data.append(['Domain/Path:', truncate_url_for_display(report.infringing_url, 70)])
        
        # Direct image URL (if different from page)
        if report.suspected_image_url and report.suspected_image_url != report.infringing_url:
            img_link = create_clickable_link(
                report.suspected_image_url,
                "Direct Image Link"
            )
            infringing_data.append(['Direct Image URL:', Paragraph(img_link, body_style)])
        
        # Screenshot evidence
        if report.screenshot_url:
            screenshot_link = create_clickable_link(
                report.screenshot_url,
                "View Screenshot Evidence"
            )
            infringing_data.append(['Screenshot Evidence:', Paragraph(screenshot_link, body_style)])
        
        # Similarity score
        if report.similarity_score:
            similarity_pct = float(report.similarity_score) * 100
            infringing_data.append(['Match Accuracy:', f"{similarity_pct:.1f}% similarity"])
        
        # Detection date
        detect_date = report.detected_at or report.created_at or datetime.utcnow()
        infringing_data.append(['Detected On:', detect_date.strftime('%B %d, %Y at %I:%M %p UTC')])
        
        infringing_table = Table(infringing_data, colWidths=[2*inch, 4*inch])
        infringing_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#FEF2F2')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(infringing_table)
        story.append(Spacer(1, 0.3*inch))
        
        # ========== COMMERCIAL USE (IF DETECTED) ==========
        if report.is_product:
            story.append(Paragraph("⚠️ COMMERCIAL USE DETECTED", heading_style))
            story.append(Spacer(1, 0.1*inch))
            
            commercial_text = """
            <b>IMPORTANT:</b> The infringing content is being used for commercial purposes, 
            which constitutes a more serious violation of copyright law and may result in 
            enhanced statutory damages.
            """
            story.append(Paragraph(commercial_text, body_style))
            story.append(Spacer(1, 0.1*inch))
            
            commercial_data = []
            commercial_data.append(['Commercial Use:', 'YES - Content being sold/monetized'])
            
            if report.product_price:
                price_str = f"{report.product_currency or '$'}{report.product_price}"
                commercial_data.append(['Listed Price:', price_str])
            
            if report.marketplace:
                commercial_data.append(['Platform/Marketplace:', report.marketplace])
            
            if report.source_name:
                commercial_data.append(['Seller/Vendor:', report.source_name])
            
            commercial_table = Table(commercial_data, colWidths=[2*inch, 4*inch])
            commercial_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFF5F5')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#EF4444')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(commercial_table)
            story.append(Spacer(1, 0.3*inch))
        
        # ========== DETAILED PAGE METADATA ==========
        if report.page_metadata or report.page_title or report.page_description:
            story.append(Paragraph("IV. INFRINGING PAGE DETAILS", heading_style))
            story.append(Spacer(1, 0.1*inch))
            
            metadata_data = []
            
            # Page title
            if report.page_title:
                metadata_data.append(['Page Title:', _wrap_text(report.page_title, 60)])
            
            # Website/Source name
            if report.source_name:
                metadata_data.append(['Website Name:', report.source_name])
            
            # Domain
            if report.source_domain:
                metadata_data.append(['Domain:', report.source_domain])
            
            # Description
            if report.page_description:
                metadata_data.append(['Page Description:', _wrap_text(report.page_description, 80)])
            
            # Author/Publisher
            if report.page_author:
                metadata_data.append(['Author/Publisher:', report.page_author])
            
            # Copyright notice (ironic if present)
            if report.page_copyright:
                metadata_data.append(['Their Copyright Notice:', _wrap_text(report.page_copyright, 60)])
            
            # Image alt text
            if report.suspected_image_alt:
                metadata_data.append(['Image Alt Text:', _wrap_text(report.suspected_image_alt, 60)])
            
            # Image title
            if report.suspected_image_title:
                metadata_data.append(['Image Title:', _wrap_text(report.suspected_image_title, 60)])
            
            # Tags/Keywords
            if report.page_tags:
                try:
                    if isinstance(report.page_tags, list):
                        tags_str = ', '.join(report.page_tags[:10])
                    else:
                        tags_str = str(report.page_tags)
                    metadata_data.append(['Keywords/Tags:', _wrap_text(tags_str, 70)])
                except:
                    pass
            
            # Google's identification
            if report.best_guess:
                metadata_data.append(['Image Identified As:', report.best_guess])
            
            # Search position
            if report.serp_position:
                metadata_data.append(['Search Result Position:', f"#{report.serp_position}"])
            
            # Technical details
            if report.image_width and report.image_height:
                metadata_data.append([
                    'Image Dimensions:', 
                    f"{report.image_width} × {report.image_height} pixels"
                ])
            
            if report.image_format:
                metadata_data.append(['Image Format:', report.image_format.upper()])
            
            if metadata_data:
                metadata_table = Table(metadata_data, colWidths=[2*inch, 4*inch])
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
            
            story.append(Spacer(1, 0.3*inch))
        
        # ========== LEGAL STATEMENTS ==========
        story.append(PageBreak())
        story.append(Paragraph("V. LEGAL STATEMENTS AND DECLARATIONS", heading_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Good faith belief
        story.append(Paragraph("A. Good Faith Belief Statement", subheading_style))
        good_faith_text = """
        I have a good faith belief that the use of the copyrighted material described above 
        in the manner complained of is not authorized by the copyright owner, its agent, or 
        the law. The use of this material does not fall under fair use, fair dealing, or any 
        other exception to copyright infringement.
        """
        story.append(Paragraph(good_faith_text, body_style))
        story.append(Spacer(1, 0.15*inch))
        
        # Accuracy statement
        story.append(Paragraph("B. Statement of Accuracy", subheading_style))
        accuracy_text = """
        I declare, under penalty of perjury under the laws of the United States of America 
        and under applicable international treaties, that the information contained in this 
        notification is accurate. I further declare that I am the copyright owner or am 
        authorized to act on behalf of the owner of an exclusive right that is allegedly 
        infringed.
        """
        story.append(Paragraph(accuracy_text, body_style))
        story.append(Spacer(1, 0.15*inch))
        
        # Authorization statement
        story.append(Paragraph("C. Authorization to Act", subheading_style))
        auth_text = """
        The undersigned is authorized to act on behalf of the copyright owner and has been 
        granted full authority to enforce the copyrights in the identified work(s). This 
        authorization includes the right to submit DMCA takedown notices and pursue legal 
        remedies for copyright infringement.
        """
        story.append(Paragraph(auth_text, body_style))
        story.append(Spacer(1, 0.3*inch))
        
        # ========== REQUIRED ACTIONS ==========
        story.append(Paragraph("VI. REQUIRED ACTIONS UNDER DMCA", heading_style))
        story.append(Spacer(1, 0.1*inch))
        
        actions_text = """
        Pursuant to the Digital Millennium Copyright Act (17 U.S.C. § 512), you are hereby 
        required to take the following actions expeditiously:
        """
        story.append(Paragraph(actions_text, body_style))
        story.append(Spacer(1, 0.1*inch))
        
        # Actions list
        actions_list = [
            "Remove or disable access to the infringing material identified in Section III of this notice",
            "Notify the alleged infringer of the removal or disabling of access to the material",
            "Provide written confirmation of compliance to the Copyright Holder within 48 hours",
            "Implement repeat infringer policies in accordance with 17 U.S.C. § 512(i)",
            "Preserve all evidence related to this infringement for potential legal proceedings"
        ]
        
        for i, action in enumerate(actions_list, 1):
            story.append(Paragraph(f"<b>{i}.</b> {action}", body_style))
            story.append(Spacer(1, 0.05*inch))
        
        story.append(Spacer(1, 0.2*inch))
        
        # Response timeline
        timeline_text = """
        <b>Response Timeline:</b> You must respond to this notice within 48 hours. Failure to 
        comply may result in further legal action, including but not limited to filing a lawsuit 
        for copyright infringement, seeking statutory damages up to $150,000 per work infringed, 
        and pursuing injunctive relief.
        """
        story.append(Paragraph(timeline_text, body_style))
        story.append(Spacer(1, 0.3*inch))
        
        # ========== LEGAL CONSEQUENCES ==========
        story.append(Paragraph("VII. LEGAL CONSEQUENCES OF NON-COMPLIANCE", heading_style))
        story.append(Spacer(1, 0.1*inch))
        
        consequences_text = """
        Failure to remove the infringing content may result in:
        <br/><br/>
        • <b>Civil Liability:</b> Statutory damages of $750 to $30,000 per work infringed, 
        or up to $150,000 per work if the infringement is found to be willful<br/>
        • <b>Injunctive Relief:</b> Court orders to cease all infringing activities<br/>
        • <b>Attorney Fees:</b> Payment of the Copyright Holder's legal costs and attorney fees<br/>
        • <b>Loss of Safe Harbor:</b> Forfeiture of DMCA safe harbor protections under 17 U.S.C. § 512<br/>
        • <b>Criminal Penalties:</b> In cases of willful infringement for commercial advantage, 
        criminal prosecution under 17 U.S.C. § 506
        """
        story.append(Paragraph(consequences_text, body_style))
        story.append(Spacer(1, 0.3*inch))
        
        # ========== CONTACT INFORMATION ==========
        story.append(Paragraph("VIII. CONTACT INFORMATION", heading_style))
        story.append(Spacer(1, 0.1*inch))
        
        story.append(Paragraph("For questions or to provide compliance confirmation, contact:", body_style))
        story.append(Spacer(1, 0.1*inch))
        
        contact_data = []
        
        if user:
            # Copyright holder contact
            if user.full_name or user.username:
                contact_data.append(['Copyright Holder:', user.full_name or user.username])
            contact_data.append(['Email:', user.email or "Available upon request"])
            if hasattr(user, 'phone_number') and user.phone_number:
                contact_data.append(['Phone:', user.phone_number])
        
        # Sentinel AI DMCA agent
        contact_data.append(['DMCA Agent:', 'Sentinel AI Legal Department'])
        contact_data.append(['Agent Email:', 'dmca@sentinelai.com'])
        contact_data.append(['Agent Phone:', '+1 (555) 123-4567'])
        contact_data.append(['Website:', 'https://sentinelai.com/dmca'])
        
        contact_table = Table(contact_data, colWidths=[2*inch, 4*inch])
        contact_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F7FAFC')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(contact_table)
        story.append(Spacer(1, 0.4*inch))
        
        # ========== SIGNATURE SECTION ==========
        story.append(Paragraph("IX. ELECTRONIC SIGNATURE", heading_style))
        story.append(Spacer(1, 0.1*inch))
        
        signature_text = """
        By submitting this notice, the Copyright Holder hereby electronically signs this 
        document and affirms that all statements herein are true and accurate under penalty 
        of perjury.
        """
        story.append(Paragraph(signature_text, body_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Signature block
        sig_data = [
            ['Signed By:', user.full_name or user.username if user else f"User #{report.user_id}"],
            ['Date:', datetime.utcnow().strftime('%B %d, %Y')],
            ['Time:', datetime.utcnow().strftime('%I:%M %p UTC')],
            ['IP Address:', '[System will log on submission]'],
            ['Electronic Signature:', '/s/ ' + (user.full_name or user.username if user else "Electronic Signature")]
        ]
        
        sig_table = Table(sig_data, colWidths=[2*inch, 4*inch])
        sig_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFBEB')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(sig_table)
        story.append(Spacer(1, 0.5*inch))
        
        # ========== FOOTER WITH LEGAL DISCLAIMER ==========
        story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
        story.append(Spacer(1, 0.15*inch))
        
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#718096'),
            alignment=TA_CENTER,
            leading=10
        )
        
        footer_text = f"""
        <b>DOCUMENT INFORMATION</b><br/>
        Report ID: {report.id} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}<br/>
        Match ID: {report.match_id} | User ID: {report.user_id}<br/>
        <br/>
        <i>This DMCA Takedown Notice was generated by Sentinel AI's automated copyright protection system.<br/>
        The system uses advanced image recognition and AI to detect unauthorized use of copyrighted content.<br/>
        All information has been verified and is accurate as of the date of issuance.</i><br/>
        <br/>
        <b>Legal Notice:</b> This document constitutes a formal DMCA takedown notice pursuant to 
        17 U.S.C. § 512(c)(3)(A).<br/>
        Willful misrepresentation in a DMCA notice may subject the complaining party to liability 
        for damages under 17 U.S.C. § 512(f).<br/>
        <br/>
        <b>Sentinel AI</b> | Copyright Protection Platform | https://sentinelai.com<br/>
        For support: support@sentinelai.com | DMCA Agent: dmca@sentinelai.com<br/>
        <br/>
        © {datetime.utcnow().year} Sentinel AI. All rights reserved. This document is confidential and legally privileged.
        """
        
        story.append(Paragraph(footer_text, footer_style))
        
        # ========== BUILD PDF ==========
        doc.build(story)
        
        logger.info(f"✅ Generated professional DMCA PDF: {output_path}")
        logger.info(f"   Report ID: {report.id}")
        logger.info(f"   User: {user.username if user else report.user_id}")
        logger.info(f"   Infringing URL: {report.infringing_url}")
        
        return output_path
        
    except Exception as e:
        logger.exception(f"❌ Failed to generate DMCA PDF for report {report.id}")
        raise


def _wrap_text(text: str, max_width: int = 60) -> str:
    """Wrap text to fit within max width for better readability."""
    if not text:
        return "N/A"
    text = str(text).strip()
    if len(text) <= max_width:
        return text
    
    # Simple word wrapping
    words = text.split()
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        if current_length + len(word) + 1 <= max_width:
            current_line.append(word)
            current_length += len(word) + 1
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
            current_length = len(word)
    
    if current_line:
        lines.append(' '.join(current_line))
    
    return '\n'.join(lines)


def _truncate(text: str, max_length: int) -> str:
    """Truncate text to max length with ellipsis."""
    if not text:
        return "N/A"
    text = str(text).strip()
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


# ========== HTML PREVIEW GENERATOR ==========
def generate_dmca_html_preview(report: Any) -> str:
    """
    Generate HTML preview of DMCA report for web display.
    
    Args:
        report: DmcaReports model instance
        
    Returns:
        HTML string
    """
    user = report.user
    user_name = user.full_name or user.username if user else f"User #{report.user_id}"
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DMCA Report #{report.id}</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }}
            .container {{
                max-width: 900px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #2c5282 0%, #2b6cb0 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 700;
            }}
            .header p {{
                font-size: 14px;
                opacity: 0.9;
            }}
            .report-id {{
                background: rgba(255,255,255,0.2);
                display: inline-block;
                padding: 8px 20px;
                border-radius: 20px;
                margin-top: 15px;
                font-weight: 600;
            }}
            .content {{
                padding: 30px;
            }}
            .section {{
                background: #f8f9fa;
                padding: 25px;
                margin-bottom: 20px;
                border-radius: 8px;
                border-left: 4px solid #2c5282;
            }}
            .section h2 {{
                color: #2c5282;
                font-size: 18px;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e2e8f0;
            }}
            .info-grid {{
                display: grid;
                gap: 12px;
            }}
            .info-row {{
                display: grid;
                grid-template-columns: 150px 1fr;
                padding: 12px;
                background: white;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
            }}
            .info-label {{
                font-weight: 600;
                color: #4a5568;
            }}
            .info-value {{
                color: #2d3748;
                word-break: break-word;
            }}
            .info-value a {{
                color: #2b6cb0;
                text-decoration: none;
                font-weight: 500;
            }}
            .info-value a:hover {{
                text-decoration: underline;
            }}
            .alert {{
                background: #fff5f5;
                border: 2px solid #fc8181;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }}
            .alert h3 {{
                color: #c53030;
                margin-bottom: 10px;
                font-size: 16px;
            }}
            .badge {{
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }}
            .badge-success {{
                background: #c6f6d5;
                color: #22543d;
            }}
            .badge-warning {{
                background: #feebc8;
                color: #744210;
            }}
            .badge-danger {{
                background: #fed7d7;
                color: #742a2a;
            }}
            .footer {{
                background: #2d3748;
                color: #cbd5e0;
                padding: 25px;
                text-align: center;
                font-size: 13px;
            }}
            .footer a {{
                color: #90cdf4;
                text-decoration: none;
            }}
            @media (max-width: 768px) {{
                .info-row {{
                    grid-template-columns: 1fr;
                    gap: 5px;
                }}
                .content {{
                    padding: 20px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚖️ DMCA TAKEDOWN NOTICE</h1>
                <p>Digital Millennium Copyright Act - 17 U.S.C. § 512(c)(3)</p>
                <div class="report-id">Report ID: #{report.id}</div>
            </div>
            
            <div class="content">
                <!-- Status Badge -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <span class="badge {'badge-success' if report.status == 'sent' else 'badge-warning'}">
                        Status: {(report.status or 'pending').upper()}
                    </span>
                </div>
                
                <!-- Copyright Holder -->
                <div class="section">
                    <h2>📋 Copyright Holder Information</h2>
                    <div class="info-grid">
                        <div class="info-row">
                            <div class="info-label">Name:</div>
                            <div class="info-value">{user_name}</div>
                        </div>
                        {f'''<div class="info-row">
                            <div class="info-label">Email:</div>
                            <div class="info-value"><a href="mailto:{user.email}">{user.email}</a></div>
                        </div>''' if user and user.email else ''}
                        {f'''<div class="info-row">
                            <div class="info-label">Phone:</div>
                            <div class="info-value">{user.phone_number}</div>
                        </div>''' if user and hasattr(user, 'phone_number') and user.phone_number else ''}
                        <div class="info-row">
                            <div class="info-label">User ID:</div>
                            <div class="info-value">#{report.user_id}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Original Work -->
                <div class="section">
                    <h2>🎨 Original Copyrighted Work</h2>
                    <div class="info-grid">
                        <div class="info-row">
                            <div class="info-label">Original URL:</div>
                            <div class="info-value">
                                <a href="{report.original_image_url or '#'}" target="_blank">
                                    View Original Work →
                                </a>
                            </div>
                        </div>
                        {f'''<div class="info-row">
                            <div class="info-label">Description:</div>
                            <div class="info-value">{report.image_caption}</div>
                        </div>''' if report.image_caption else ''}
                        <div class="info-row">
                            <div class="info-label">Created:</div>
                            <div class="info-value">{report.created_at.strftime('%B %d, %Y') if report.created_at else 'N/A'}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Infringing Content -->
                <div class="section">
                    <h2>⚠️ Infringing Content Location</h2>
                    <div class="info-grid">
                        <div class="info-row">
                            <div class="info-label">Infringing URL:</div>
                            <div class="info-value">
                                <a href="{report.infringing_url or '#'}" target="_blank">
                                    View Infringing Content →
                                </a>
                            </div>
                        </div>
                        {f'''<div class="info-row">
                            <div class="info-label">Domain:</div>
                            <div class="info-value">{report.source_domain}</div>
                        </div>''' if report.source_domain else ''}
                        {f'''<div class="info-row">
                            <div class="info-label">Website:</div>
                            <div class="info-value">{report.source_name}</div>
                        </div>''' if report.source_name else ''}
                        <div class="info-row">
                            <div class="info-label">Match Accuracy:</div>
                            <div class="info-value">{float(report.similarity_score or 0) * 100:.1f}% similarity</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Detected:</div>
                            <div class="info-value">{(report.detected_at or report.created_at).strftime('%B %d, %Y at %I:%M %p UTC') if report.detected_at or report.created_at else 'N/A'}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Commercial Use Alert -->
                {f'''<div class="alert">
                    <h3>🚨 COMMERCIAL USE DETECTED</h3>
                    <p>The infringing content is being used for commercial purposes, which constitutes a more serious violation.</p>
                    <div class="info-grid" style="margin-top: 15px;">
                        <div class="info-row">
                            <div class="info-label">Commercial Use:</div>
                            <div class="info-value"><strong>YES - Content being sold</strong></div>
                        </div>
                        {f"""<div class="info-row">
                            <div class="info-label">Listed Price:</div>
                            <div class="info-value">{report.product_currency or '$'}{report.product_price}</div>
                        </div>""" if report.product_price else ''}
                        {f"""<div class="info-row">
                            <div class="info-label">Platform:</div>
                            <div class="info-value">{report.marketplace}</div>
                        </div>""" if report.marketplace else ''}
                    </div>
                </div>''' if report.is_product else ''}
                
                <!-- Page Details -->
                {f'''<div class="section">
                    <h2>📄 Page Metadata</h2>
                    <div class="info-grid">
                        {f"""<div class="info-row">
                            <div class="info-label">Page Title:</div>
                            <div class="info-value">{report.page_title}</div>
                        </div>""" if report.page_title else ''}
                        {f"""<div class="info-row">
                            <div class="info-label">Description:</div>
                            <div class="info-value">{report.page_description[:200]}...</div>
                        </div>""" if report.page_description else ''}
                        {f"""<div class="info-row">
                            <div class="info-label">Author:</div>
                            <div class="info-value">{report.page_author}</div>
                        </div>""" if report.page_author else ''}
                        {f"""<div class="info-row">
                            <div class="info-label">Image Alt:</div>
                            <div class="info-value">{report.suspected_image_alt}</div>
                        </div>""" if report.suspected_image_alt else ''}
                    </div>
                </div>''' if report.page_title or report.page_description else ''}
                
                <!-- Legal Statements -->
                <div class="section">
                    <h2>⚖️ Legal Declarations</h2>
                    <p style="margin-bottom: 15px;">
                        <strong>Good Faith Belief:</strong> I have a good faith belief that the use of the copyrighted 
                        materials described above is not authorized by the copyright owner, its agent, or the law.
                    </p>
                    <p>
                        <strong>Penalty of Perjury:</strong> I swear, under penalty of perjury, that the information 
                        in this notification is accurate and that I am the copyright owner or authorized to act on 
                        behalf of the owner.
                    </p>
                </div>
                
                <!-- Required Actions -->
                <div class="section">
                    <h2>📋 Required Actions</h2>
                    <p style="margin-bottom: 10px;"><strong>You must:</strong></p>
                    <ol style="margin-left: 20px; color: #2d3748;">
                        <li>Remove or disable access to the infringing material immediately</li>
                        <li>Provide written confirmation of removal within 48 hours</li>
                        <li>Notify the alleged infringer of this takedown notice</li>
                        <li>Preserve all evidence for potential legal proceedings</li>
                    </ol>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Generated by Sentinel AI</strong> | {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                <p style="margin-top: 10px;">
                    Report ID: {report.id} | Match ID: {report.match_id}<br/>
                    This document is issued under the DMCA, 17 U.S.C. § 512(c)(3)
                </p>
                <p style="margin-top: 15px;">
                    <a href="https://sentinelai.com">sentinelai.com</a> | 
                    <a href="mailto:dmca@sentinelai.com">dmca@sentinelai.com</a> | 
                    <a href="mailto:support@sentinelai.com">support@sentinelai.com</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    return html
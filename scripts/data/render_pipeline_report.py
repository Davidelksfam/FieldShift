"""Render the committed Markdown report to PDF (optional: pip install reportlab)."""
import re
from html import escape
from pathlib import Path
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'docs/data/PIPELINE_REPORT.md'
BASE='https://github.com/Davidelksfam/FieldShift/blob/data/seven-source-access-kit/'

def inline(text):
    def link(m):
        label,url=m.groups()
        if not url.startswith('https://'):url=BASE+str((SOURCE.parent/url).resolve().relative_to(ROOT))
        return '<a color="#135b7a" href="'+escape(url,quote=True)+'">'+escape(label)+'</a>'
    parts=re.split(r'(\[[^\]]+\]\([^)]+\))',text)
    return ''.join(re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,p) if p.startswith('[') else escape(p) for p in parts)

def main():
    font_dir=Path('/usr/share/fonts/truetype/dejavu')
    pdfmetrics.registerFont(TTFont('ReportSans',str(font_dir/'DejaVuSans.ttf')))
    pdfmetrics.registerFont(TTFont('ReportBold',str(font_dir/'DejaVuSans-Bold.ttf')))
    pdfmetrics.registerFont(TTFont('ReportMono',str(font_dir/'DejaVuSansMono.ttf')))
    styles=getSampleStyleSheet()
    for name in ['Title','Heading1','Heading2','Heading3']:styles[name].fontName='ReportBold'
    styles.add(ParagraphStyle(name='BodyReport',fontName='ReportSans',fontSize=9,leading=13,spaceAfter=7))
    styles.add(ParagraphStyle(name='CellReport',fontName='ReportSans',fontSize=7.4,leading=10,alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='CodeReport',fontName='ReportMono',fontSize=7,leading=10,spaceAfter=3))
    story=[];lines=SOURCE.read_text().splitlines();i=0;code=False
    while i<len(lines):
        line=lines[i];i+=1
        if line.startswith('```'):code=not code;continue
        if code:
            story.append(Paragraph(escape(line),styles['CodeReport']));continue
        if not line.strip():continue
        if line.startswith('|'):
            rows=[line]
            while i<len(lines) and lines[i].startswith('|'):rows.append(lines[i]);i+=1
            cells=[[Paragraph(inline(c.strip()),styles['CellReport']) for c in r.strip('|').split('|')] for r in rows if not re.fullmatch(r'[| :\-]+',r)]
            width=6.65*inch;table=Table(cells,colWidths=[width/len(cells[0])]*len(cells[0]),repeatRows=1,hAlign='LEFT')
            table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dcebed')),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#b8c7ca')),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
            story.extend([table,Spacer(1,10)]);continue
        if line.startswith('#'):
            level=len(line)-len(line.lstrip('#'))
            story.append(Paragraph(inline(line.lstrip('#').strip()),styles['Title' if level==1 else 'Heading'+str(min(level-1,3))]));continue
        story.append(Paragraph(inline(line),styles['BodyReport']))
    def footer(canvas,doc):
        canvas.setFont('ReportSans',8);canvas.setFillColor(colors.HexColor('#52646b'))
        canvas.drawString(42,30,'FieldShift | Regional research pipeline | 13 November 2026')
        canvas.drawRightString(570,30,str(doc.page))
    target=SOURCE.with_suffix('.pdf')
    SimpleDocTemplate(str(target),pagesize=(612,792),leftMargin=42,rightMargin=42,topMargin=40,bottomMargin=48,title='FieldShift regional data and integration pipeline',author='FieldShift research workstream').build(story,onFirstPage=footer,onLaterPages=footer)
    print(target.relative_to(ROOT))

if __name__=='__main__':main()

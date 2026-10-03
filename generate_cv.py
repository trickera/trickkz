"""Generate the two public résumé PDFs. Run with the bundled reportlab Python."""

from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether


ROOT = Path(__file__).parent / "assets"
DATA = {
    "pt": {
        "file": "Patrick_Ferreira-DevOps.pdf",
        "title": "DevOps & AI Engineer",
        "summary_title": "RESUMO",
        "summary": "Profissional de TI com mais de 8 anos de experiência em suporte, infraestrutura, cloud e DevOps. Atuo no Melhor Envio com infraestrutura cloud, automação e confiabilidade. Também desenvolvo aplicações de IA, copilotos e agentes com LLMs, RAG e fine-tuning.",
        "skills_title": "COMPETÊNCIAS",
        "skills": "AWS · Azure · GCP · Terraform · Docker · Kubernetes · CI/CD · GitHub Actions · Observabilidade · Python · Bash · PowerShell · Agentes de IA · RAG",
        "experience_title": "EXPERIÊNCIA",
        "jobs": [
            ("DevOps | Melhor Envio · LWSA", "ago 2026 – atual", "Infraestrutura cloud, automação e confiabilidade."),
            ("Analista DevOps | BoostingMarket.com", "dez 2024 – abr 2026", "Microsserviços em Kubernetes (AWS EKS), pipelines CI/CD, Terraform e observabilidade. Deploy médio de 45 para menos de 10 minutos; redução de 40% no MTTR."),
            ("Cofundador e Responsável Técnico | Dark Tech", "jul 2024 – dez 2024", "Infraestrutura AWS, automação e desenho de base operacional segura para consultoria tecnológica."),
            ("Líder de Suporte e Analista DevOps | Ecossistema XP", "mai 2022 – jul 2024", "Suporte e infraestrutura para mais de 500 usuários em ambiente financeiro regulado, com SLA acima de 98%."),
            ("Técnico de Suporte e Infraestrutura | Gigaware Informática", "2015 – 2020", "Manutenção de estações, servidores, redes locais e sistemas Windows."),
        ],
        "education_title": "FORMAÇÃO",
        "education": "Bacharelado em Ciência da Computação · UniRitter · cursando",
        "cert_title": "CERTIFICAÇÕES",
        "certs": "AWS Certified AI Practitioner · AWS<br/>DevOps & Site Reliability Engineering · Linux Foundation<br/>Cybersecurity Essentials · Linux Foundation<br/>GitHub Actions: Automação de Workflows · GitHub / Microsoft<br/>Cisco Network Basics · Cisco",
        "languages": "Idiomas: Português nativo · Inglês avançado · Espanhol intermediário",
    },
    "en": {
        "file": "Patrick_Ferreira-DevOps-EN.pdf",
        "title": "DevOps & AI Engineer",
        "summary_title": "SUMMARY",
        "summary": "IT professional with 8+ years of experience across support, infrastructure, cloud and DevOps. I work on cloud infrastructure, automation and reliability at Melhor Envio. I also build AI applications, copilots and agents using LLMs, RAG and fine-tuning.",
        "skills_title": "SKILLS",
        "skills": "AWS · Azure · GCP · Terraform · Docker · Kubernetes · CI/CD · GitHub Actions · Observability · Python · Bash · PowerShell · AI Agents · RAG",
        "experience_title": "EXPERIENCE",
        "jobs": [
            ("DevOps | Melhor Envio · LWSA", "Aug 2026 – present", "Cloud infrastructure, automation and reliability."),
            ("DevOps Analyst | BoostingMarket.com", "Dec 2024 – Apr 2026", "Microservices on Kubernetes (AWS EKS), CI/CD pipelines, Terraform and observability. Reduced average deployment time from 45 to under 10 minutes and MTTR by 40%."),
            ("Co-founder & Technical Lead | Dark Tech", "Jul 2024 – Dec 2024", "AWS infrastructure, automation and secure operational foundation for a technology consultancy."),
            ("Support Lead & DevOps Analyst | XP ecosystem", "May 2022 – Jul 2024", "Support and infrastructure for 500+ users in a regulated financial environment, with 98%+ SLA."),
            ("IT Support & Infrastructure Technician | Gigaware Informática", "2015 – 2020", "Workstation, server, local network and Windows system maintenance."),
        ],
        "education_title": "EDUCATION",
        "education": "B.Sc. in Computer Science · UniRitter · in progress",
        "cert_title": "CERTIFICATIONS",
        "certs": "AWS Certified AI Practitioner · AWS<br/>DevOps & Site Reliability Engineering · Linux Foundation<br/>Cybersecurity Essentials · Linux Foundation<br/>GitHub Actions: Workflow Automation · GitHub / Microsoft<br/>Cisco Network Basics · Cisco",
        "languages": "Languages: Portuguese native · English advanced · Spanish intermediate",
    },
}


def build(lang, data):
    output = ROOT / data["file"]
    doc = SimpleDocTemplate(str(output), pagesize=A4, rightMargin=42, leftMargin=42, topMargin=35, bottomMargin=34)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="NameCustom", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=18, leading=21, alignment=TA_CENTER, textColor=colors.HexColor("#132b3a"), spaceAfter=4))
    styles.add(ParagraphStyle(name="SubCustom", parent=styles["Normal"], fontSize=10, leading=13, alignment=TA_CENTER, textColor=colors.HexColor("#33556a"), spaceAfter=3))
    styles.add(ParagraphStyle(name="SectionCustom", parent=styles["Heading2"], fontSize=10, leading=13, textColor=colors.HexColor("#126f79"), spaceBefore=12, spaceAfter=4))
    styles.add(ParagraphStyle(name="BodyCustom", parent=styles["BodyText"], fontSize=8.8, leading=12.3, spaceAfter=3))
    styles.add(ParagraphStyle(name="JobCustom", parent=styles["BodyCustom"], fontName="Helvetica-Bold", spaceBefore=5, spaceAfter=2))
    story = [
        Paragraph("PATRICK FERREIRA", styles["NameCustom"]),
        Paragraph(data["title"], styles["SubCustom"]),
        Paragraph("Porto Alegre, Brasil · trickkkz@outlook.com · github.com/trickera · trickkz.com", styles["SubCustom"]),
        Paragraph("linkedin.com/in/patrick-ferreira-949117212", styles["SubCustom"]),
    ]
    def section(title, body):
        story.append(Paragraph(title, styles["SectionCustom"]))
        story.append(Paragraph(body, styles["BodyCustom"]))
    section(data["summary_title"], data["summary"])
    section(data["skills_title"], data["skills"])
    story.append(Paragraph(data["experience_title"], styles["SectionCustom"]))
    for title, dates, description in data["jobs"]:
        story.append(KeepTogether([Paragraph(title + " <font color='#596b73'>| " + dates + "</font>", styles["JobCustom"]), Paragraph(description, styles["BodyCustom"])]))
    section(data["education_title"], data["education"])
    section(data["cert_title"], data["certs"])
    story.append(Spacer(1, 6))
    story.append(Paragraph(data["languages"], styles["BodyCustom"]))
    doc.build(story)
    print(output)


if __name__ == "__main__":
    for language, payload in DATA.items():
        build(language, payload)

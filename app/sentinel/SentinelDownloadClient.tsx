'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Lang = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
];

const T: Record<Lang, Record<string, string>> = {
  en: {
    kicker: 'SENTINEL — PRE-SECURITY FOR AI AGENTS',
    briefTitle: 'WHY PRE-SECURITY, WHY NOW',
    briefText:
      'Rogue AI agents made October 2026 the loudest month in agent security yet. Read our trends brief.',
    briefCta: 'Read the October 2026 brief',
    scannerTitle: 'NEW — SENTINEL SCANNER, FOR ROBOTS AND SMART DEVICES',
    scannerText:
      'Some robots ship with trapdoors: hidden tunnels that stream data back to the maker, and wireless controls anyone nearby can seize with no password. In 2026 the Pentagon listed one major maker as a Chinese military company and the FCC banned its new robot models, citing exactly those flaws. Sentinel Scanner audits any robot or device for that whole class of gaps before it is trusted on your network, then blocks the harmful paths and quarantines machines that fail. And for the newest threat — self-spreading AI worms hopping between unsecured home devices, which Anthropic warns could arrive within a year — WormShield watches for the moment a device starts spreading and cuts it off with the kill switch. A worm with no off switch meets a network that has one.',
    scannerCta: 'Get a free device scan — part of the free two-week pilot',
    title: 'Get Sentinel',
    subtitle:
      'One tap. Protected. Pick your device below — no account, no subscription, nothing leaves your device.',
    language: 'Language:',
    androidTitle: 'Android phone',
    androidDesc:
      'The Sentinel app filters every lookup on your phone. Tap Protect and you\u2019re covered.',
    androidBtn: 'Download for Android',
    iphoneTitle: 'iPhone',
    iphoneDesc:
      'The iPhone app is still being built — Apple requires their own build tools, which we\u2019re setting up now.',
    soon: 'Coming soon',
    windowsTitle: 'Windows computer',
    windowsDesc:
      'Sentinel for Windows — install it, tap Protect, done. Same protection as the phone app.',
    windowsBtn: 'Download for Windows',
    windowsNote:
      'This downloads a small setup file — it fetches the rest automatically. Windows may show a SmartScreen warning on first install — the installer isn\u2019t signed yet. Click \u201CMore info\u201D \u2192 \u201CRun anyway\u201D.',
    macTitle: 'Mac computer',
    macDesc:
      'The Mac app is still being built — it needs Apple\u2019s build tools, same as the iPhone app.',
    footerA: 'Sentinel blocks what you tell it to block and never touches your bank or email. Read the',
    footerLink: 'privacy policy',
    footerB: '.',
  },
  es: {
    kicker: 'SENTINEL — PRE-SEGURIDAD PARA AGENTES DE IA',
    briefTitle: 'POR QUÉ PRE-SEGURIDAD, POR QUÉ AHORA',
    briefText:
      'Los agentes de IA fuera de control convirtieron octubre de 2026 en el mes más ruidoso de la seguridad de agentes. Lea nuestro informe de tendencias.',
    briefCta: 'Leer el informe de octubre 2026',
    scannerTitle: 'NUEVO — SENTINEL SCANNER, PARA ROBOTS Y DISPOSITIVOS INTELIGENTES',
    scannerText:
      'Algunos robots vienen con trampas: túneles ocultos que envían datos al fabricante y controles inalámbricos que cualquiera cercano puede tomar sin contraseña. En 2026 el Pentágono declaró a un gran fabricante empresa militar china y la FCC prohibió sus nuevos modelos por exactamente esas fallas. Sentinel Scanner audita cualquier robot o dispositivo en busca de toda esa clase de brechas antes de que entre en su red, bloquea las rutas dañinas y pone en cuarentena las máquinas que no pasan. Y contra la amenaza más nueva, los gusanos de IA que se propagan solos entre dispositivos domésticos sin seguridad (Anthropic advierte que podrían llegar en menos de un año), WormShield vigila el momento en que un dispositivo empieza a propagarse y lo corta con el interruptor de apagado. Un gusano sin interruptor se encuentra con una red que sí lo tiene.',
    scannerCta: 'Pida un escaneo gratuito — parte del piloto gratuito de dos semanas',
    title: 'Obtener Sentinel',
    subtitle:
      'Un toque. Protegido. Elija su dispositivo — sin cuenta, sin suscripción, nada sale de su dispositivo.',
    language: 'Idioma:',
    androidTitle: 'Teléfono Android',
    androidDesc:
      'La app de Sentinel filtra cada búsqueda en su teléfono. Toque Proteger y listo.',
    androidBtn: 'Descargar para Android',
    iphoneTitle: 'iPhone',
    iphoneDesc:
      'La app para iPhone aún está en desarrollo — Apple exige sus propias herramientas, que estamos configurando.',
    soon: 'Próximamente',
    windowsTitle: 'Computadora Windows',
    windowsDesc:
      'Sentinel para Windows — instálelo, toque Proteger, listo. La misma protección que en el teléfono.',
    windowsBtn: 'Descargar para Windows',
    windowsNote:
      'Esto descarga un pequeño instalador — el resto se descarga solo. Windows puede mostrar una advertencia de SmartScreen la primera vez — el instalador aún no está firmado. Haga clic en \u201CMás información\u201D \u2192 \u201CEjecutar de todos modos\u201D.',
    macTitle: 'Computadora Mac',
    macDesc:
      'La app para Mac aún está en desarrollo — necesita las herramientas de Apple, igual que la app de iPhone.',
    footerA: 'Sentinel bloquea lo que usted le indique y nunca toca su banco ni su correo. Lea la',
    footerLink: 'política de privacidad',
    footerB: '.',
  },
  fr: {
    kicker: 'SENTINEL — PRÉ-SÉCURITÉ POUR AGENTS IA',
    briefTitle: 'POURQUOI LA PRÉ-SÉCURITÉ, POURQUOI MAINTENANT',
    briefText:
      "Les agents IA hors de contrôle ont fait d'octobre 2026 le mois le plus marquant de la sécurité des agents. Lisez notre dossier tendances.",
    briefCta: "Lire le dossier d'octobre 2026",
    scannerTitle: 'NOUVEAU — SENTINEL SCANNER, POUR ROBOTS ET APPAREILS CONNECTÉS',
    scannerText:
      'Certains robots cachent des trappes : des tunnels dissimulés qui envoient des données au fabricant et des commandes sans fil que n\u2019importe qui à proximité peut prendre sans mot de passe. En 2026, le Pentagone a classé un grand fabricant comme entreprise militaire chinoise et la FCC a interdit ses nouveaux modèles pour exactement ces failles. Sentinel Scanner audite tout robot ou appareil pour détecter toute cette classe de failles avant son entrée sur votre réseau, bloque les voies nuisibles et met en quarantaine les machines qui échouent. Et contre la menace la plus récente, les vers IA qui se propagent seuls entre appareils domestiques mal sécurisés (Anthropic prévient qu\u2019ils pourraient arriver d\u2019ici un an), WormShield surveille le moment où un appareil commence à se répandre et le coupe avec l\u2019interrupteur d\u2019arrêt. Un ver sans interrupteur rencontre un réseau qui en a un.',
    scannerCta: 'Demandez un scan gratuit — inclus dans le pilote gratuit de deux semaines',
    title: 'Télécharger Sentinel',
    subtitle:
      'Un toucher. Protégé. Choisissez votre appareil — sans compte, sans abonnement, rien ne quitte votre appareil.',
    language: 'Langue :',
    androidTitle: 'Téléphone Android',
    androidDesc:
      'L\u2019appli Sentinel filtre chaque recherche sur votre téléphone. Touchez Protéger et c\u2019est fait.',
    androidBtn: 'Télécharger pour Android',
    iphoneTitle: 'iPhone',
    iphoneDesc:
      'L\u2019appli iPhone est encore en développement — Apple exige ses propres outils, que nous installons actuellement.',
    soon: 'Bientôt disponible',
    windowsTitle: 'Ordinateur Windows',
    windowsDesc:
      'Sentinel pour Windows — installez, touchez Protéger, c\u2019est tout. La même protection que sur téléphone.',
    windowsBtn: 'Télécharger pour Windows',
    windowsNote:
      'Ceci télécharge un petit programme d\u2019installation — le reste suit automatiquement. Windows peut afficher un avertissement SmartScreen à la première installation — le programme d\u2019installation n\u2019est pas encore signé. Cliquez sur \u201CInformations complémentaires\u201D \u2192 \u201CExécuter quand même\u201D.',
    macTitle: 'Ordinateur Mac',
    macDesc:
      'L\u2019appli Mac est encore en développement — elle nécessite les outils d\u2019Apple, comme l\u2019appli iPhone.',
    footerA: 'Sentinel bloque ce que vous lui demandez et ne touche jamais à votre banque ni à vos e-mails. Lisez la',
    footerLink: 'politique de confidentialité',
    footerB: '.',
  },
  de: {
    kicker: 'SENTINEL — PRE-SECURITY FÜR KI-AGENTEN',
    briefTitle: 'WARUM PRE-SECURITY, WARUM JETZT',
    briefText:
      'Außer Kontrolle geratene KI-Agenten machten den Oktober 2026 zum lautesten Monat der Agenten-Sicherheit. Lesen Sie unser Trend-Briefing.',
    briefCta: 'Briefing Oktober 2026 lesen',
    scannerTitle: 'NEU — SENTINEL SCANNER, FÜR ROBOTER UND SMARTE GERÄTE',
    scannerText:
      'Manche Roboter haben Hintertüren: versteckte Tunnel, die Daten an den Hersteller senden, und Funksteuerungen, die jeder in der Nähe ohne Passwort übernehmen kann. 2026 stufte das Pentagon einen großen Hersteller als chinesisches Militärunternehmen ein, und die FCC verbot seine neuen Modelle — wegen genau dieser Fehler. Sentinel Scanner prüft jeden Roboter und jedes Gerät auf diese gesamte Klasse von Lücken, bevor sie in Ihr Netzwerk dürfen, blockiert die schädlichen Wege und stellt Maschinen unter Quarantäne, die durchfallen. Und gegen die neueste Bedrohung, sich selbst verbreitende KI-Würmer, die zwischen ungesicherten Heimgeräten springen (Anthropic warnt: möglicherweise binnen eines Jahres), erkennt WormShield den Moment, in dem ein Gerät zu streuen beginnt, und trennt es per Notausschalter. Ein Wurm ohne Ausschalter trifft auf ein Netzwerk, das einen hat.',
    scannerCta: 'Kostenlosen Geräte-Scan anfordern — Teil des kostenlosen zweiwöchigen Pilots',
    title: 'Sentinel holen',
    subtitle:
      'Ein Tipp. Geschützt. Wählen Sie Ihr Gerät — kein Konto, kein Abo, nichts verlässt Ihr Gerät.',
    language: 'Sprache:',
    androidTitle: 'Android-Handy',
    androidDesc:
      'Die Sentinel-App filtert jede Anfrage auf Ihrem Handy. Tippen Sie auf Schützen — fertig.',
    androidBtn: 'Für Android laden',
    iphoneTitle: 'iPhone',
    iphoneDesc:
      'Die iPhone-App ist noch in Arbeit — Apple verlangt eigene Build-Tools, die wir gerade einrichten.',
    soon: 'Kommt bald',
    windowsTitle: 'Windows-Computer',
    windowsDesc:
      'Sentinel für Windows — installieren, auf Schützen tippen, fertig. Derselbe Schutz wie auf dem Handy.',
    windowsBtn: 'Für Windows laden',
    windowsNote:
      'Dies lädt ein kleines Setup-Programm — der Rest folgt automatisch. Windows zeigt bei der ersten Installation evtl. eine SmartScreen-Warnung — das Installationsprogramm ist noch nicht signiert. Klicken Sie auf \u201CWeitere Informationen\u201D \u2192 \u201CTrotzdem ausführen\u201D.',
    macTitle: 'Mac-Computer',
    macDesc:
      'Die Mac-App ist noch in Arbeit — sie braucht Apples Build-Tools, genau wie die iPhone-App.',
    footerA: 'Sentinel blockiert, was Sie ihm sagen, und berührt nie Ihre Bank oder E-Mails. Lesen Sie die',
    footerLink: 'Datenschutzerklärung',
    footerB: '.',
  },
  pt: {
    kicker: 'SENTINEL — PRÉ-SEGURANÇA PARA AGENTES DE IA',
    briefTitle: 'POR QUE PRÉ-SEGURANÇA, POR QUE AGORA',
    briefText:
      'Agentes de IA fora de controle fizeram de outubro de 2026 o mês mais marcante da segurança de agentes. Leia nosso informe de tendências.',
    briefCta: 'Ler o informe de outubro de 2026',
    scannerTitle: 'NOVO — SENTINEL SCANNER, PARA ROBÔS E DISPOSITIVOS INTELIGENTES',
    scannerText:
      'Alguns robôs vêm com armadilhas: túneis ocultos que enviam dados ao fabricante e controles sem fio que qualquer pessoa próxima pode assumir sem senha. Em 2026, o Pentágono classificou um grande fabricante como empresa militar chinesa e a FCC proibiu seus novos modelos por exatamente essas falhas. O Sentinel Scanner audita qualquer robô ou dispositivo em busca de toda essa classe de brechas antes de entrar na sua rede, bloqueia os caminhos prejudiciais e coloca em quarentena as máquinas reprovadas. E contra a ameaça mais nova, os vermes de IA que se espalham sozinhos entre dispositivos domésticos inseguros (a Anthropic alerta que podem chegar em menos de um ano), o WormShield vigia o momento em que um dispositivo começa a se espalhar e o corta com o interruptor de desligamento. Um verme sem interruptor encontra uma rede que tem um.',
    scannerCta: 'Peça uma verificação gratuita — parte do piloto gratuito de duas semanas',
    title: 'Baixar o Sentinel',
    subtitle:
      'Um toque. Protegido. Escolha seu dispositivo — sem conta, sem assinatura, nada sai do seu dispositivo.',
    language: 'Idioma:',
    androidTitle: 'Celular Android',
    androidDesc:
      'O app Sentinel filtra cada busca no seu celular. Toque em Proteger e pronto.',
    androidBtn: 'Baixar para Android',
    iphoneTitle: 'iPhone',
    iphoneDesc:
      'O app para iPhone ainda está em desenvolvimento — a Apple exige suas próprias ferramentas, que estamos configurando.',
    soon: 'Em breve',
    windowsTitle: 'Computador Windows',
    windowsDesc:
      'Sentinel para Windows — instale, toque em Proteger, pronto. A mesma proteção do celular.',
    windowsBtn: 'Baixar para Windows',
    windowsNote:
      'Isto baixa um pequeno instalador — o resto vem automaticamente. O Windows pode mostrar um aviso do SmartScreen na primeira instalação — o instalador ainda não é assinado. Clique em \u201CMais informações\u201D \u2192 \u201CExecutar assim mesmo\u201D.',
    macTitle: 'Computador Mac',
    macDesc:
      'O app para Mac ainda está em desenvolvimento — precisa das ferramentas da Apple, como o app de iPhone.',
    footerA: 'O Sentinel bloqueia o que você mandar e nunca toca no seu banco nem no seu e-mail. Leia a',
    footerLink: 'política de privacidade',
    footerB: '.',
  },
  zh: {
    kicker: 'SENTINEL — AI 智能体的预安全防护',
    briefTitle: '为什么是预安全，为什么是现在',
    briefText:
      '失控的 AI 智能体让 2026 年 10 月成为智能体安全最受关注的一个月。阅读我们的趋势简报。',
    briefCta: '阅读2026年10月简报',
    scannerTitle: '新功能 — SENTINEL SCANNER,面向机器人与智能设备',
    scannerText:
      '有些机器人带有后门:隐藏隧道会把数据传回厂商,无线控制则可被附近任何人无密码接管。2026年,五角大楼将一家主要厂商列为中国军方企业,FCC 也以正是这些缺陷为由禁止其新型号上市。Sentinel Scanner 会在机器人或设备接入您的网络之前,审计整类安全缺口,阻断有害通道,并隔离未通过检测的机器。面对最新威胁——在无安全防护的家庭设备之间自我传播的 AI 蠕虫(Anthropic 警告其可能在一年内出现)——WormShield 会监视设备开始扩散的瞬间,并用关停开关将其切断。没有开关的蠕虫,遇上了一张有开关的网络。',
    scannerCta: '获取免费设备扫描 — 免费两周试点的一部分',
    title: '获取 Sentinel',
    subtitle: '一键开启，全面保护。选择您的设备——无需账户，无需订阅，数据不出设备。',
    language: '语言：',
    androidTitle: '安卓手机',
    androidDesc: 'Sentinel 应用会过滤手机上的每一次查询。点击“保护”，即刻生效。',
    androidBtn: '下载安卓版',
    iphoneTitle: 'iPhone',
    iphoneDesc: 'iPhone 版仍在开发中——苹果要求使用其专用构建工具，我们正在配置中。',
    soon: '即将推出',
    windowsTitle: 'Windows 电脑',
    windowsDesc: 'Windows 版 Sentinel——安装后点击“保护”即可，与手机版同样的防护。',
    windowsBtn: '下载 Windows 版',
    windowsNote:
      '这会先下载一个小型安装程序——其余部分会自动下载。首次安装时 Windows 可能显示 SmartScreen 警告——安装程序尚未签名。请点击“更多信息”→“仍要运行”。',
    macTitle: 'Mac 电脑',
    macDesc: 'Mac 版仍在开发中——需要苹果构建工具，与 iPhone 版相同。',
    footerA: 'Sentinel 只拦截您指定的内容，绝不触碰您的银行或邮件。请阅读',
    footerLink: '隐私政策',
    footerB: '。',
  },
};

const card: React.CSSProperties = {
  background: '#0E1E33',
  border: '1px solid #1E3A5F',
  borderRadius: 20,
  padding: 28,
  flex: '1 1 260px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const btn: React.CSSProperties = {
  display: 'inline-block',
  textAlign: 'center',
  background: '#ffb45e',
  color: '#1a1206',
  fontWeight: 800,
  fontSize: 16,
  padding: '14px 22px',
  borderRadius: 12,
  textDecoration: 'none',
  marginTop: 8,
};

const btnDisabled: React.CSSProperties = {
  ...btn,
  background: '#2A3B52',
  color: '#8A97A8',
};

export default function SentinelDownloadClient() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const nav = (navigator.language || 'en').toLowerCase();
    const match = LANGS.find((l) => nav.startsWith(l.code));
    if (match) setLang(match.code);
  }, []);

  const t = T[lang];

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#081120',
        color: '#fff',
        padding: '64px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <label style={{ color: '#B8C4D5', fontSize: 14, marginRight: 8, alignSelf: 'center' }}>
            {t.language}
          </label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            style={{
              background: '#0E1E33',
              color: '#fff',
              border: '1px solid #1E3A5F',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
            }}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{ color: '#ffb45e', fontWeight: 800, fontSize: 13, letterSpacing: 2, marginBottom: 12 }}
        >
          {t.kicker}
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 900, margin: '0 0 12px' }}>{t.title}</h1>
        <p style={{ color: '#B8C4D5', fontSize: 18, margin: '0 0 40px', maxWidth: 640 }}>
          {t.subtitle}
        </p>

        <a
          href="https://muse.ai/s/sentinel-security-trends-brief-cxf66glxj5xfxs2"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textDecoration: 'none',
            margin: '0 0 40px',
            padding: '20px 24px',
            borderRadius: 12,
            border: '1px solid #1E3A5F',
            background: '#0E1E33',
            maxWidth: 640,
          }}
        >
          <div
            style={{
              color: '#ffb45e',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            {t.briefTitle}
          </div>
          <p style={{ color: '#B8C4D5', fontSize: 15, margin: '0 0 12px', lineHeight: 1.5 }}>
            {t.briefText}
          </p>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{t.briefCta} →</span>
        </a>

        <Link
          href="/sentinel-pilot"
          style={{
            display: 'block',
            textDecoration: 'none',
            margin: '0 0 40px',
            padding: '20px 24px',
            borderRadius: 12,
            border: '1px solid #ffb45e',
            background: '#14273F',
            maxWidth: 640,
          }}
        >
          <div
            style={{
              color: '#ffb45e',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            {t.scannerTitle}
          </div>
          <p style={{ color: '#D7E1EE', fontSize: 15, margin: '0 0 12px', lineHeight: 1.5 }}>
            {t.scannerText}
          </p>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{t.scannerCta} →</span>
        </Link>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={card}>
            <div style={{ fontSize: 40 }}>📱</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>{t.androidTitle}</h2>
            <p style={{ color: '#B8C4D5', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              {t.androidDesc}
            </p>
            <a href="/sentinel/sentinel-mobile.apk" style={btn}>
              {t.androidBtn}
            </a>
          </div>

          <div style={card}>
            <div style={{ fontSize: 40 }}>🍎</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>{t.iphoneTitle}</h2>
            <p style={{ color: '#B8C4D5', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              {t.iphoneDesc}
            </p>
            <span style={btnDisabled}>{t.soon}</span>
          </div>

          <div style={card}>
            <div style={{ fontSize: 40 }}>💻</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>{t.windowsTitle}</h2>
            <p style={{ color: '#B8C4D5', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              {t.windowsDesc}
            </p>
            <a
              href="/sentinel-desktop/SentinelWebSetup-1.0.0.exe"
              style={btn}
            >
              {t.windowsBtn}
            </a>
            <p style={{ color: '#7A8699', margin: 0, fontSize: 12, lineHeight: 1.5 }}>
              {t.windowsNote}
            </p>
          </div>

          <div style={card}>
            <div style={{ fontSize: 40 }}>🖥️</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>{t.macTitle}</h2>
            <p style={{ color: '#B8C4D5', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
              {t.macDesc}
            </p>
            <span style={btnDisabled}>{t.soon}</span>
          </div>
        </div>

        <p style={{ color: '#7A8699', fontSize: 14, marginTop: 40 }}>
          {t.footerA}{' '}
          <Link href="/sentinel-privacy" style={{ color: '#ffb45e' }}>
            {t.footerLink}
          </Link>
          {t.footerB}
        </p>
      </div>
    </main>
  );
}

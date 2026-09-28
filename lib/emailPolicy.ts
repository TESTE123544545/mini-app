/**
 * Which e-mail addresses may hold an account. Blocks, at sign-up and login:
 *  - reserved and test domains (example.com, *.test, *.invalid…), which can never receive mail;
 *  - disposable / temporary inbox services (mailinator, 10minutemail, temp-mail…);
 * and, at sign-up only, domains that don't exist or can't receive e-mail (no MX / A record in DNS),
 * with a "did you mean gmail.com?" hint for the common typos.
 */

export const RESERVED = ["example.com", "example.net", "example.org", "example.edu", "test.com", "teste.com", "teste.com.br"];
export const RESERVED_SUFFIXES = [".example", ".test", ".invalid", ".localhost", ".local", ".internal", ".lan", ".home"];

// Common temporary-inbox services (and their aliases). Lower-case, exact domain or parent domain.
const DISPOSABLE = new Set([
  "mailinator.com", "mailinator.net", "mailinator2.com", "maildrop.cc", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz",
  "guerrillamail.de", "guerrillamailblock.com", "sharklasers.com", "grr.la", "pokemail.net", "spam4.me", "10minutemail.com", "10minutemail.net",
  "10minutemail.co.uk", "10minemail.com", "20minutemail.com", "temp-mail.org", "temp-mail.io", "tempmail.com", "tempmail.net", "tempmail.dev",
  "tempmailo.com", "tempmail.plus", "tempail.com", "tempr.email", "temp-mail.com", "tmpmail.org", "tmpmail.net", "tmpeml.com", "tmails.net",
  "yopmail.com", "yopmail.net", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf", "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr",
  "courriel.fr.nf", "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf", "throwawaymail.com", "trashmail.com", "trashmail.net", "trashmail.de",
  "trashmail.io", "trash-mail.com", "dispostable.com", "fakeinbox.com", "fakemail.net", "fake-mail.net", "getnada.com", "nada.email", "inboxbear.com",
  "mohmal.com", "mintemail.com", "mytemp.email", "mailnesia.com", "mailcatch.com", "mailpoof.com", "moakt.com", "moakt.cc", "emailondeck.com",
  "burnermail.io", "spamgourmet.com", "spambox.us", "spamex.com", "mailforspam.com", "discard.email", "discardmail.com", "discardmail.de",
  "emailfake.com", "email-fake.com", "fakemailgenerator.com", "armyspy.com", "cuvox.de", "dayrep.com", "einrot.com", "fleckens.hu", "gustr.com",
  "jourrapide.com", "rhyta.com", "superrito.com", "teleworm.us", "mailtemp.net", "minuteinbox.com", "emailtemporanea.com", "emailtemporario.com.br",
  "tempomail.fr", "trbvm.com", "byom.de", "harakirimail.com", "incognitomail.org", "mailexpire.com", "mailmoat.com", "mailnull.com", "meltmail.com",
  "mt2015.com", "mvrht.com", "nwytg.net", "owlymail.com", "punkass.com", "safetymail.info", "sofort-mail.de", "spamfree24.org", "tempinbox.com",
  "thankyou2010.com", "trashymail.com", "wegwerfmail.de", "wegwerfmail.net", "zetmail.com", "33mail.com", "anonbox.net", "anonymbox.com",
  "binkmail.com", "bobmail.info", "chammy.info", "devnullmail.com", "dropmail.me", "emltmp.com", "etranquil.com", "filzmail.com", "fixmail.tk",
  "hmamail.com", "inboxkitten.com", "kasmail.com", "linshiyouxiang.net", "mail7.io", "mailbox52.ga", "mailhazard.com", "mailsac.com", "mailslurp.com",
  "mfsa.ru", "nowmymail.com", "oneoffemail.com", "one-time.email", "proxymail.eu", "rcpt.at", "spamdecoy.net", "spambog.com", "tempemail.net",
  "tempmailaddress.com", "temporarymail.com", "trash2009.com", "vomoto.com", "xojxe.com", "yepmail.net", "zippymail.info", "luxusmail.org",
  "emailnax.com", "cyclelove.cc", "ezztt.com", "kzccv.com", "qiott.com", "wuuvo.com", "vjuum.com", "laafd.com", "txcct.com", "jxpomup.com",
]);

// Frequent typos of the big providers → the right domain, for a friendly hint.
const TYPOS: Record<string, string> = {
  "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.comi": "gmail.com", "gmail.cm": "gmail.com", "gmail.om": "gmail.com", "gmail.cmo": "gmail.com",
  "gmail.com.br": "gmail.com", "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gnail.com": "gmail.com", "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com", "gmail.coom": "gmail.com", "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.con": "hotmail.com",
  "hotmail.co": "hotmail.com", "hotmal.com": "hotmail.com", "hotmil.com": "hotmail.com", "outlok.com": "outlook.com", "outlook.con": "outlook.com",
  "outloo.com": "outlook.com", "yahoo.con": "yahoo.com", "yaho.com": "yahoo.com", "yahoo.com.b": "yahoo.com.br", "icloud.con": "icloud.com", "iclod.com": "icloud.com",
};

export function emailDomain(email: string) {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

function matchesDomain(domain: string, list: Set<string> | string[]) {
  const parts = domain.split(".");
  for (let index = 0; index < parts.length - 1; index += 1) {
    const candidate = parts.slice(index).join(".");
    if (Array.isArray(list) ? list.includes(candidate) : list.has(candidate)) return true;
  }
  return false;
}

/** Reserved, test or temporary-inbox domain: never allowed to sign up or log in. */
export function isBlockedEmail(email: string) {
  const domain = emailDomain(email);
  return matchesDomain(domain, RESERVED) || RESERVED_SUFFIXES.some((suffix) => domain.endsWith(suffix)) || matchesDomain(domain, DISPOSABLE);
}

export function typoSuggestion(email: string) {
  const fixed = TYPOS[emailDomain(email)];
  return fixed ? `${email.slice(0, email.lastIndexOf("@") + 1)}${fixed}` : null;
}

const dnsCache = new Map<string, boolean>();

/** Whether the domain exists and can receive mail (an MX record, or at least an A record). Fails open on a DNS outage. */
export async function domainReceivesMail(domain: string) {
  if (dnsCache.has(domain)) return dnsCache.get(domain)!;
  const lookup = async (type: "MX" | "A") => {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`dns ${response.status}`);
    return response.json() as Promise<{ Status: number; Answer?: { type: number; data: string }[] }>;
  };
  try {
    const mx = await lookup("MX");
    if (mx.Status === 3) { dnsCache.set(domain, false); return false; } // NXDOMAIN: the domain doesn't exist
    // A "null MX" (RFC 7505, data ".") means the domain explicitly accepts no mail.
    const realMx = (mx.Answer ?? []).filter((record) => record.type === 15 && !/^0\s+\.$/.test(record.data.trim()));
    let ok = realMx.length > 0;
    if (!ok && !(mx.Answer ?? []).some((record) => record.type === 15)) ok = ((await lookup("A")).Answer ?? []).some((record) => record.type === 1);
    dnsCache.set(domain, ok);
    return ok;
  } catch {
    return true;
  }
}

/** Why this address can't be used to sign up, or null when it can. */
export async function signupEmailProblem(email: string): Promise<string | null> {
  const suggestion = typoSuggestion(email);
  if (suggestion) return `Parece que o e-mail tem um erro de digitação. Você quis dizer ${suggestion}?`;
  if (isBlockedEmail(email)) return "Use o seu e-mail de verdade — endereços temporários ou de teste não são aceitos.";
  if (!(await domainReceivesMail(emailDomain(email)))) return "Esse e-mail não existe ou não recebe mensagens. Confira o endereço digitado.";
  return null;
}

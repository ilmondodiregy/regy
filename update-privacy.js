#!/usr/bin/env node

/**
 * 🔧 PRIVACY POLICY AUTO-UPDATER
 *
 * Questo script sostituisce automaticamente i placeholder [DA COMPILARE]
 * nella Privacy Policy dentro index.html usando i dati da privacy-config.json
 *
 * COME USARE:
 * 1. Compila il file privacy-config.json con i tuoi dati reali
 * 2. Esegui: node update-privacy.js
 * 3. Il file index.html verrà aggiornato automaticamente
 *
 * BACKUP:
 * Lo script crea automaticamente un backup prima di modificare index.html
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURAZIONE
// ==========================================

const CONFIG_FILE = 'privacy-config.json';
const HTML_FILE = 'index.html';
const BACKUP_DIR = 'backups';

// ==========================================
// FUNZIONI HELPER
// ==========================================

function createBackup(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(BACKUP_DIR, `privacy-update-${timestamp}`);

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
    }

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const backupPath = path.join(backupDir, path.basename(filePath) + '.backup');
    fs.copyFileSync(filePath, backupPath);

    console.log(`✅ Backup creato: ${backupPath}`);
    return backupPath;
}

function loadConfig() {
    try {
        const configPath = path.join(__dirname, CONFIG_FILE);
        if (!fs.existsSync(configPath)) {
            console.error(`❌ ERRORE: File ${CONFIG_FILE} non trovato!`);
            console.error(`   Assicurati che il file ${CONFIG_FILE} esista nella stessa cartella.`);
            process.exit(1);
        }

        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error(`❌ ERRORE nel leggere ${CONFIG_FILE}:`, error.message);
        process.exit(1);
    }
}

function validateConfig(config) {
    const errors = [];

    // Campi obbligatori (minimi per GDPR)
    const requiredFields = {
        'company.name': 'Nome azienda/titolare',
        'company.address': 'Indirizzo',
        'company.email': 'Email',
        'privacy.privacyEmail': 'Email contatti privacy'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
        const keys = field.split('.');
        let value = config;
        for (const key of keys) {
            value = value?.[key];
        }

        if (!value || value.trim() === '') {
            errors.push(`- ${label} (${field})`);
        }
    }

    if (errors.length > 0) {
        console.error('❌ ERRORE: Campi obbligatori mancanti in privacy-config.json:');
        errors.forEach(err => console.error(err));
        console.error('\n💡 Compila tutti i campi obbligatori e riprova.');
        process.exit(1);
    }

    console.log('✅ Configurazione valida');
    return true;
}

function buildPrivacyText(config) {
    const { company, privacy } = config;

    // Testo per il Titolare del Trattamento
    const titolareText = `
Nome/Ragione Sociale: ${company.legalName || company.name}
Indirizzo: ${company.address}${company.city ? `, ${company.city}` : ''}${company.postalCode ? ` ${company.postalCode}` : ''}
${company.country ? `Paese: ${company.country}` : ''}
${company.vatNumber ? `P.IVA: ${company.vatNumber}` : ''}
Email: ${company.email}
Telefono: ${company.phone}
${company.pec ? `PEC: ${company.pec}` : ''}
`.trim();

    // Testo per i Contatti Privacy
    const contattiText = `
Email: ${privacy.privacyEmail || company.email}
${privacy.privacyPhone || company.phone ? `Telefono: ${privacy.privacyPhone || company.phone}` : ''}
${company.pec ? `PEC: ${company.pec}` : ''}
${privacy.dpoName ? `\nData Protection Officer (DPO): ${privacy.dpoName}` : ''}
${privacy.dpoEmail ? `Email DPO: ${privacy.dpoEmail}` : ''}
`.trim();

    return { titolareText, contattiText };
}

function updateHTML(htmlContent, config) {
    const { titolareText, contattiText } = buildPrivacyText(config);

    let updated = htmlContent;
    let replacements = 0;

    // Pattern 1: Sostituisci il blocco completo del Titolare (circa linea 9854)
    const titolarePattern = /\[DA COMPILARE CON I DATI REALI\]\s*Nome\/Ragione Sociale:[^\n]*\n[^\n]*Indirizzo:[^\n]*\n[^\n]*Email:[^\n]*\n[^\n]*Telefono:[^\n]*/g;

    if (titolarePattern.test(updated)) {
        updated = updated.replace(titolarePattern, titolareText);
        replacements++;
        console.log('✅ Sostituito: Titolare del Trattamento');
    }

    // Pattern 2: Sostituisci il blocco completo dei Contatti (circa linea 9954)
    const contattiPattern = /\[DA COMPILARE CON DATI REALI\]\s*Email:[^\n]*\n[^\n]*Telefono:[^\n]*/g;

    if (contattiPattern.test(updated)) {
        updated = updated.replace(contattiPattern, contattiText);
        replacements++;
        console.log('✅ Sostituito: Contatti Privacy');
    }

    // Pattern 3: Fallback - sostituisce qualsiasi [DA COMPILARE] rimanente con alert
    const remainingPlaceholders = (updated.match(/\[DA COMPILARE[^\]]*\]/g) || []).length;

    if (remainingPlaceholders > 0) {
        console.warn(`⚠️  ATTENZIONE: ${remainingPlaceholders} placeholder [DA COMPILARE] non sostituiti`);
        console.warn('   Potrebbero esserci campi opzionali o formato differente.');
    }

    if (replacements === 0) {
        console.warn('⚠️  ATTENZIONE: Nessun placeholder trovato da sostituire!');
        console.warn('   Possibili cause:');
        console.warn('   - I placeholder sono già stati sostituiti');
        console.warn('   - Il formato del testo è cambiato');
        return null;
    }

    return updated;
}

function updateMarkdownFile(config) {
    const mdPath = path.join(__dirname, 'PRIVACY_POLICY.md');

    if (!fs.existsSync(mdPath)) {
        console.log('ℹ️  File PRIVACY_POLICY.md non trovato, salto aggiornamento');
        return;
    }

    try {
        let mdContent = fs.readFileSync(mdPath, 'utf8');
        const { titolareText, contattiText } = buildPrivacyText(config);

        // Sostituisci nel markdown
        mdContent = mdContent.replace(
            /\[DA COMPILARE\]\s*Nome\/Ragione Sociale:[^\n]*\n[^\n]*Indirizzo:[^\n]*\n[^\n]*Email:[^\n]*\n[^\n]*Telefono:[^\n]*/,
            titolareText
        );

        mdContent = mdContent.replace(
            /\[DA COMPILARE CON DATI REALI\]\s*Email:[^\n]*\n[^\n]*Telefono:[^\n]*/g,
            contattiText
        );

        // Backup + salva
        createBackup(mdPath);
        fs.writeFileSync(mdPath, mdContent, 'utf8');
        console.log('✅ File PRIVACY_POLICY.md aggiornato');

    } catch (error) {
        console.error('❌ Errore aggiornando PRIVACY_POLICY.md:', error.message);
    }
}

// ==========================================
// MAIN
// ==========================================

function main() {
    console.log('🔧 PRIVACY POLICY AUTO-UPDATER');
    console.log('================================\n');

    // 1. Carica configurazione
    console.log('📖 Caricamento configurazione...');
    const config = loadConfig();

    // 2. Valida configurazione
    console.log('🔍 Validazione configurazione...');
    validateConfig(config);

    // 3. Carica index.html
    const htmlPath = path.join(__dirname, HTML_FILE);
    if (!fs.existsSync(htmlPath)) {
        console.error(`❌ ERRORE: File ${HTML_FILE} non trovato!`);
        process.exit(1);
    }

    console.log(`📄 Lettura ${HTML_FILE}...`);
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // 4. Crea backup
    console.log('💾 Creazione backup...');
    createBackup(htmlPath);

    // 5. Aggiorna contenuto
    console.log('✏️  Aggiornamento Privacy Policy...');
    const updatedHTML = updateHTML(htmlContent, config);

    if (updatedHTML === null) {
        console.log('\n⚠️  Nessuna modifica effettuata.');
        process.exit(0);
    }

    // 6. Salva file aggiornato
    fs.writeFileSync(htmlPath, updatedHTML, 'utf8');
    console.log(`✅ File ${HTML_FILE} aggiornato con successo!`);

    // 7. Aggiorna anche PRIVACY_POLICY.md se esiste
    console.log('\n📝 Aggiornamento PRIVACY_POLICY.md...');
    updateMarkdownFile(config);

    // 8. Riepilogo finale
    console.log('\n================================');
    console.log('✅ COMPLETATO!');
    console.log('\n📋 Cosa è stato fatto:');
    console.log('   - Backup creato in backups/');
    console.log('   - Privacy Policy aggiornata in index.html');
    console.log('   - PRIVACY_POLICY.md aggiornato (se presente)');
    console.log('\n💡 Prossimi passi:');
    console.log('   1. Apri index.html in un browser per verificare');
    console.log('   2. Controlla che i dati siano corretti');
    console.log('   3. Se tutto ok, puoi deployare su GitHub Pages');
    console.log('\n🔄 Per ripristinare backup:');
    console.log('   Vedi istruzioni in backups/privacy-update-*/');
}

// Esegui script
if (require.main === module) {
    main();
}

module.exports = { loadConfig, validateConfig, buildPrivacyText, updateHTML };

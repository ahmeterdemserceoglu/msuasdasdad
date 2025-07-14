import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { verifyAuth } from '@/app/lib/auth';
import fs from 'fs';
import path from 'path';

// Bu fonksiyon, bir kullanıcının admin olup olmadığını kontrol eder.
async function isAdmin(userId: string): Promise<boolean> {
    try {
        const userDocRef = adminDb.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (userDoc.exists && userDoc.data()?.isAdmin === true) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Güvenlik açıklarını tespit etmek için kod analizi
interface SecurityVulnerability {
    type: 'sql_injection' | 'xss' | 'csrf' | 'path_traversal' | 'code_injection' | 'weak_auth' | 'insecure_config';
    severity: 'low' | 'medium' | 'high' | 'critical';
    file: string;
    line: number;
    description: string;
    code: string;
    recommendation: string;
}

// Güvenlik açıklarını tespit eden fonksiyon
async function scanForVulnerabilities(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const projectRoot = process.cwd();
    
    // Taranacak dosya türleri
    const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    // Güvenlik açığı desenleri
    const patterns = {
        sql_injection: [
            /query\s*\(\s*['"`].*\$\{.*\}.*['"`]\s*\)/gi,
            /exec\s*\(\s*['"`].*\$\{.*\}.*['"`]\s*\)/gi,
            /SELECT\s+.*\+.*FROM/gi,
            /INSERT\s+.*\+.*INTO/gi,
            /UPDATE\s+.*\+.*SET/gi,
            /DELETE\s+.*\+.*FROM/gi
        ],
        xss: [
            /innerHTML\s*=\s*.*\$\{.*\}/gi,
            /outerHTML\s*=\s*.*\$\{.*\}/gi,
            /document\.write\s*\(.*\$\{.*\}.*\)/gi,
            /dangerouslySetInnerHTML\s*=\s*{{.*}}/gi,
            /eval\s*\(.*\$\{.*\}.*\)/gi
        ],
        csrf: [
            /method\s*:\s*['"`]POST['"`].*(?!csrf)/gi,
            /fetch\s*\(.*method\s*:\s*['"`]POST['"`].*(?!csrf)/gi,
            /axios\.post\s*\(.*(?!csrf)/gi
        ],
        path_traversal: [
            /readFile\s*\(.*\$\{.*\}.*\)/gi,
            /writeFile\s*\(.*\$\{.*\}.*\)/gi,
            /path\.join\s*\(.*\$\{.*\}.*\)/gi,
            /fs\.readFileSync\s*\(.*\$\{.*\}.*\)/gi
        ],
        code_injection: [
            /eval\s*\(/gi,
            /Function\s*\(/gi,
            /setTimeout\s*\(\s*['"`].*\$\{.*\}.*['"`]/gi,
            /setInterval\s*\(\s*['"`].*\$\{.*\}.*['"`]/gi
        ],
        weak_auth: [
            /password\s*=\s*['"`]['"`]/gi,
            /token\s*=\s*['"`]['"`]/gi,
            /secret\s*=\s*['"`]['"`]/gi,
            /md5\s*\(/gi,
            /sha1\s*\(/gi
        ],
        insecure_config: [
            /console\.log\s*\(.*password.*\)/gi,
            /console\.log\s*\(.*token.*\)/gi,
            /console\.log\s*\(.*uid.*\)/gi,
            /console\.log\s*\(.*email.*\)/gi,
            /http:\/\/(?!localhost)/gi
        ]
    };
    
    // Güvenlik açığı önerileri
    const recommendations = {
        sql_injection: 'Parameterized queries veya prepared statements kullanın',
        xss: 'Input validation ve output encoding uygulayın',
        csrf: 'CSRF token kontrolü ekleyin',
        path_traversal: 'Input validation ve path sanitization uygulayın',
        code_injection: 'Dinamik kod çalıştırmaktan kaçının',
        weak_auth: 'Güçlü şifreleme algoritmaları kullanın (bcrypt, scrypt)',
        insecure_config: 'Hassas bilgileri environment variables ile saklayın'
    };
    
    // Dosyaları taramak için yardımcı fonksiyon
    const scanDirectory = async (dir: string): Promise<void> => {
        try {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // node_modules ve .git klasörlerini atla
                    if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
                        await scanDirectory(fullPath);
                    }
                } else if (fileExtensions.some(ext => item.endsWith(ext))) {
                    await scanFile(fullPath);
                }
            }
        } catch (error) {
            console.error('Error scanning directory:', error);
        }
    };
    
    // Dosya tarama fonksiyonu
    const scanFile = async (filePath: string): Promise<void> => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((currentLine, index) => {
                // Her güvenlik açığı türü için kontrol
                Object.entries(patterns).forEach(([type, patternList]) => {
                    patternList.forEach(pattern => {
                        const matches = currentLine.match(pattern);
                        if (matches) {
                            const severity = getSeverity(type as keyof typeof patterns);
                            vulnerabilities.push({
                                type: type as SecurityVulnerability['type'],
                                severity,
                                file: path.relative(projectRoot, filePath),
                                line: index + 1,
                                description: getDescription(type as keyof typeof patterns, matches[0]),
                                code: currentLine.trim(),
                                recommendation: recommendations[type as keyof typeof recommendations]
                            });
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Error scanning file:', error);
        }
    };
    
    // Güvenlik açığı şiddeti belirleme
    const getSeverity = (type: keyof typeof patterns): SecurityVulnerability['severity'] => {
        switch (type) {
            case 'sql_injection':
            case 'code_injection':
                return 'critical';
            case 'xss':
            case 'path_traversal':
                return 'high';
            case 'csrf':
            case 'weak_auth':
                return 'medium';
            case 'insecure_config':
                return 'low';
            default:
                return 'medium';
        }
    };
    
    // Güvenlik açığı açıklaması
    const getDescription = (type: keyof typeof patterns, match: string): string => {
        switch (type) {
            case 'sql_injection':
                return `Potansiyel SQL Injection açığı tespit edildi: ${match}`;
            case 'xss':
                return `Potansiyel XSS açığı tespit edildi: ${match}`;
            case 'csrf':
                return `CSRF koruması eksik: ${match}`;
            case 'path_traversal':
                return `Path traversal açığı tespit edildi: ${match}`;
            case 'code_injection':
                return `Kod injection açığı tespit edildi: ${match}`;
            case 'weak_auth':
                return `Zayıf kimlik doğrulama tespit edildi: ${match}`;
            case 'insecure_config':
                return `Güvenli olmayan konfigürasyon: ${match}`;
            default:
                return `Güvenlik açığı tespit edildi: ${match}`;
        }
    };
    
    // Projeyi tara
    await scanDirectory(projectRoot);
    
    return vulnerabilities;
}

export async function GET(req: NextRequest) {
    try {
        // Token doğrulaması yap
        const authResult = await verifyAuth(req);
        
        if (!authResult.authenticated) {
            return NextResponse.json(
                { error: authResult.error || 'Yetkisiz erişim' },
                { status: 401 }
            );
        }

        const userId = authResult.userId!;

        // Kullanıcının admin yetkisi olup olmadığını kontrol et
        const userIsAdmin = await isAdmin(userId);
        if (!userIsAdmin) {
            return new NextResponse(JSON.stringify({ error: 'Yetkisiz erişim.' }), { status: 403 });
        }

        // Güvenlik açığı taraması yap
        const vulnerabilities = await scanForVulnerabilities();
        
        // Güvenlik açıklarını güvenlik loglarına dönüştür
        const vulnerabilityLogs = vulnerabilities.map((vuln, index) => ({
            id: `vuln-${index}`,
            timestamp: new Date(),
            userId: 'system',
            userEmail: 'system@security.scan',
            userDisplayName: 'Security Scanner',
            action: `Güvenlik Açığı Tespit Edildi: ${vuln.type}`,
            type: 'security_violation' as const,
            severity: vuln.severity,
            description: `${vuln.description} - Dosya: ${vuln.file}:${vuln.line}`,
            ipAddress: '127.0.0.1',
            userAgent: 'Security Scanner Bot',
            location: 'Sistem İçi',
            metadata: {
                vulnerabilityType: vuln.type,
                file: vuln.file,
                line: vuln.line,
                code: vuln.code,
                recommendation: vuln.recommendation
            }
        }));

        // Tarihe göre sırala (en yeniden en eskiye)
        const sortedLogs = vulnerabilityLogs.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return NextResponse.json(sortedLogs, { status: 200 });
    } catch (error) {
        console.error("Error fetching security logs: ", error);
        return new NextResponse(JSON.stringify({ error: 'Sunucu hatası.' }), { status: 500 });
    }
}

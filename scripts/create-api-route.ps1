# Create API Route Script for MSU Mülakat
param(
    [Parameter(Mandatory=$true)]
    [string]$RouteName,
    
    [Parameter(Mandatory=$false)]
    [string]$Method = "GET,POST",
    
    [Parameter(Mandatory=$false)]
    [switch]$WithAuth = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$WithValidation = $false
)

$BasePath = Join-Path $PSScriptRoot "..\app\api"
$RoutePath = Join-Path $BasePath $RouteName

# Create directory if it doesn't exist
if (!(Test-Path $RoutePath)) {
    New-Item -ItemType Directory -Path $RoutePath -Force | Out-Null
}

# Generate route template
$RouteContent = @"
import { NextRequest, NextResponse } from 'next/server';
$(if ($WithAuth) { "import { verifyAuth } from '@/app/lib/auth';" })
$(if ($WithValidation) { "import { z } from 'zod';" })
import { db } from '@/app/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';

$(if ($WithValidation) { @"
// Validation schemas
const createSchema = z.object({
    // Add your fields here
    // example: name: z.string().min(1),
});

const updateSchema = z.object({
    // Add your fields here
});
"@ })

"@

# Add methods
$Methods = $Method.Split(',')

foreach ($m in $Methods) {
    $m = $m.Trim().ToUpper()
    
    switch ($m) {
        "GET" {
            $RouteContent += @"

export async function GET(
    req: NextRequest,
    { params }: { params: { id?: string } }
) {
    try {
        $(if ($WithAuth) { @"
        // Verify authentication
        const authResult = await verifyAuth(req);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = authResult;
"@ })
        
        // Get query parameters
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        
        if (params.id) {
            // Get single document
            const docRef = doc(db, '$RouteName', params.id);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            
            return NextResponse.json({
                id: docSnap.id,
                ...docSnap.data()
            });
        } else {
            // Get collection
            const q = query(
                collection(db, '$RouteName'),
                orderBy('createdAt', 'desc'),
                limit(limit)
            );
            
            const querySnapshot = await getDocs(q);
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return NextResponse.json({
                items,
                page,
                limit,
                total: items.length
            });
        }
    } catch (error) {
        console.error('GET /$RouteName error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
"@
        }
        
        "POST" {
            $RouteContent += @"

export async function POST(req: NextRequest) {
    try {
        $(if ($WithAuth) { @"
        // Verify authentication
        const authResult = await verifyAuth(req);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = authResult;
"@ })
        
        const body = await req.json();
        
        $(if ($WithValidation) { @"
        // Validate input
        const validationResult = createSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }
        const data = validationResult.data;
"@ } else { "const data = body;" })
        
        // Create document
        const docData = {
            ...data,
            $(if ($WithAuth) { "userId," })
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, '$RouteName'), docData);
        
        return NextResponse.json(
            { id: docRef.id, ...docData },
            { status: 201 }
        );
    } catch (error) {
        console.error('POST /$RouteName error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
"@
        }
        
        "PUT" {
            $RouteContent += @"

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        $(if ($WithAuth) { @"
        // Verify authentication
        const authResult = await verifyAuth(req);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = authResult;
"@ })
        
        const body = await req.json();
        
        $(if ($WithValidation) { @"
        // Validate input
        const validationResult = updateSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }
        const data = validationResult.data;
"@ } else { "const data = body;" })
        
        // Update document
        const docRef = doc(db, '$RouteName', params.id);
        
        // Check if document exists
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        
        $(if ($WithAuth) { @"
        // Check ownership
        if (docSnap.data().userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
"@ })
        
        const updateData = {
            ...data,
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(docRef, updateData);
        
        return NextResponse.json({ id: params.id, ...updateData });
    } catch (error) {
        console.error('PUT /$RouteName error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
"@
        }
        
        "DELETE" {
            $RouteContent += @"

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        $(if ($WithAuth) { @"
        // Verify authentication
        const authResult = await verifyAuth(req);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = authResult;
"@ })
        
        const docRef = doc(db, '$RouteName', params.id);
        
        // Check if document exists
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        
        $(if ($WithAuth) { @"
        // Check ownership
        if (docSnap.data().userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
"@ })
        
        await deleteDoc(docRef);
        
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('DELETE /$RouteName error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
"@
        }
    }
}

# Write route file
$RouteFile = Join-Path $RoutePath "route.ts"
Set-Content -Path $RouteFile -Value $RouteContent -Encoding UTF8

# Create dynamic route for ID parameter if needed
if ($Methods -contains "PUT" -or $Methods -contains "DELETE" -or $Method -contains "GET") {
    $DynamicPath = Join-Path $RoutePath "[id]"
    if (!(Test-Path $DynamicPath)) {
        New-Item -ItemType Directory -Path $DynamicPath -Force | Out-Null
    }
    
    $DynamicContent = @"
export { GET, PUT, DELETE } from '../route';
"@
    
    $DynamicFile = Join-Path $DynamicPath "route.ts"
    Set-Content -Path $DynamicFile -Value $DynamicContent -Encoding UTF8
}

Write-Host "✅ API Route created successfully!" -ForegroundColor Green
Write-Host "📁 Location: $RoutePath" -ForegroundColor Cyan
Write-Host "📝 Methods: $($Methods -join ', ')" -ForegroundColor Yellow
if ($WithAuth) { Write-Host "🔐 Authentication: Enabled" -ForegroundColor Magenta }
if ($WithValidation) { Write-Host "✔️  Validation: Enabled" -ForegroundColor Blue }

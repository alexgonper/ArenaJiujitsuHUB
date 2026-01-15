const fetch = require('node-fetch'); // Assuming node-fetch v2 or using native fetch in newer node
// In Node 22, fetch is native.

const LOCAL_URL = 'http://localhost:5000/api/v1';
const REMOTE_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

async function fetchData(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            return { error: `Status ${res.status}` };
        }
        return await res.json();
    } catch (e) {
        return { error: e.message };
    }
}

async function compare() {
    console.log(`📊 Comparando Bancos de Dados`);
    console.log(`🏠 Local: ${LOCAL_URL}`);
    console.log(`☁️ Remote: ${REMOTE_URL}`);
    console.log('------------------------------------------------');

    // 1. Franchises
    console.log('\n🔍 Buscando Franquias...');
    const localFranchises = await fetchData(`${LOCAL_URL}/franchises`);
    const remoteFranchises = await fetchData(`${REMOTE_URL}/franchises`);

    const localF = localFranchises.data || [];
    const remoteF = remoteFranchises.data || [];

    console.log(`🏠 Franquias Locais: ${localF.length}`);
    console.log(`☁️ Franquias Remotas: ${remoteF.length}`);

    // Map IDs to Names for easier reading
    const localMap = {};
    localF.forEach(f => localMap[f._id] = f.name);
    
    const remoteMap = {};
    remoteF.forEach(f => remoteMap[f._id] = f.name);

    // 2. Compare content
    const inBoth = localF.filter(l => remoteF.some(r => r._id === l._id));
    const onlyLocal = localF.filter(l => !remoteF.some(r => r._id === l._id));
    const onlyRemote = remoteF.filter(r => !localF.some(l => l._id === r._id));

    if (onlyLocal.length > 0) {
        console.log('\n❌ Apenas no Local:');
        onlyLocal.forEach(f => console.log(` - ${f.name} (${f._id})`));
    }

    if (onlyRemote.length > 0) {
        console.log('\n❌ Apenas no Remoto:');
        onlyRemote.forEach(f => console.log(` - ${f.name} (${f._id})`));
    }

    // 3. Compare Classes for Franchises present in both
    if (inBoth.length > 0) {
        console.log('\n🔍 Comparando Aulas (para franquias em comum)...');
        
        for (const f of inBoth) {
            console.log(`\n➡️ Analisando: ${f.name}`);
            
            const localClasses = await fetchData(`${LOCAL_URL}/classes/franchise/${f._id}`);
            const remoteClasses = await fetchData(`${REMOTE_URL}/classes/franchise/${f._id}`);

            const localC = localClasses.data || [];
            const remoteC = remoteClasses.data || [];

            console.log(`   🏠 Total Aulas Local: ${localC.length}`);
            console.log(`   ☁️ Total Aulas Remoto: ${remoteC.length}`);

            if (localC.length !== remoteC.length) {
                console.log(`   ⚠️ Diferença de ${Math.abs(localC.length - remoteC.length)} aulas.`);
            } else {
                console.log(`   ✅ Contagem sincronizada.`);
            }
        }
    } else {
        console.log('\n⚠️ Nenhuma franquia com ID idêntico encontrada em ambos. IDs podem ter mudado se o banco foi resetado.');
        
        // Try comparing by Name if IDs differ
        console.log('\n🔍 Tentando comparar por NOME...');
        const inBothByName = localF.filter(l => remoteF.some(r => r.name === l.name));
        
        for (const f of inBothByName) {
            const remoteMatch = remoteF.find(r => r.name === f.name);
            console.log(`\n➡️ Analisando: ${f.name}`);
            console.log(`   ID Local: ${f._id} | ID Remoto: ${remoteMatch._id}`);

            const localClasses = await fetchData(`${LOCAL_URL}/classes/franchise/${f._id}`);
            const remoteClasses = await fetchData(`${REMOTE_URL}/classes/franchise/${remoteMatch._id}`);

            const localC = localClasses.data || [];
            const remoteC = remoteClasses.data || [];

            console.log(`   🏠 Total Aulas Local: ${localC.length}`);
            console.log(`   ☁️ Total Aulas Remoto: ${remoteC.length}`);
        }
    }

}

compare();

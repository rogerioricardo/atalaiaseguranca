const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace(
    /navigator\.geolocation\.getCurrentPosition\(async \(position\) => \{([\s\S]*?)showToast\(\`Check-in de ronda concluído! \$\{targetUser \? \`Notificação enviada para o WhatsApp de \$\{targetUser\.name\}\.\` : ''\}\`, 'success'\);\s*setPatrolLoading\(false\);\s*\}, \(error\)/,
    `navigator.geolocation.getCurrentPosition(async (position) => {
                        try {
                            $1
                            showToast(\`Check-in de ronda concluído! \${targetUser ? \`Notificação enviada para o WhatsApp de \${targetUser.name}.\` : ''}\`, 'success');
                        } catch (err: any) {
                            showToast("Erro ao registrar ronda: " + (err.message || 'Falha desconhecida'), 'error');
                        } finally {
                            setPatrolLoading(false);
                        }
                    }, (error)`
);

content = content.replace(
    /\} else if \(pendingAction\.type === 'LOG'\) \{\s*await MockService\.registerPatrol\([\s\S]*?\);\s*showToast\(\`Registro inserido! \$\{targetUser \? \`Alerta WhatsApp disparado para \$\{targetUser\.name\}\.\` : 'Ocorrência geral registrada\.'\}\`, 'success'\);\s*setPatrolLoading\(false\);\s*\}/,
    `} else if (pendingAction.type === 'LOG') {
                try {
                    await MockService.registerPatrol(
                        user.id, 
                        user.neighborhoodId!, 
                        \`OCORRÊNCIA: \${pendingAction.note}\`,
                        undefined,
                        undefined,
                        targetUserId
                    );
                    showToast(\`Registro inserido! \${targetUser ? \`Alerta WhatsApp disparado para \${targetUser.name}.\` : 'Ocorrência geral registrada.'}\`, 'success');
                } catch (err: any) {
                    showToast("Erro ao registrar ocorrência: " + (err.message || 'Falha desconhecida'), 'error');
                } finally {
                    setPatrolLoading(false);
                }
            }`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);

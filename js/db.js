import { openDB } from "idb";

let db;
async function criarDB(){
    try {
        db = await openDB('banco', 1, {
            upgrade(db, oldVersion, newVersion, transaction){
                switch  (oldVersion) {
                    case 0:
                    case 1:
                        const store = db.createObjectStore('anotacao', {
                            keyPath: 'titulo'
                        });
                        store.createIndex('id', 'id');
                        console.log("banco de dados criado!");
                }
            }
        });
        console.log("banco de dados aberto!");
    }catch (e) {
        console.log('Erro ao criar/abrir banco: ' + e.message);
    }
}

window.addEventListener('DOMContentLoaded', async event =>{
    criarDB();
    document.getElementById('btnCadastro').addEventListener('click', adicionarAnotacao);
    document.getElementById('btnCarregar').addEventListener('click', buscarTodasAnotacoes);
    document.getElementById('btnRemover').addEventListener('click', removerAnotacao);
    document.getElementById('btnBuscar').addEventListener('click', buscarAnotacao);
    document.getElementById('btnAtualiza').addEventListener('click', atualizarAnotacao);
    document.getElementById('btnCancelaAtualizacao').addEventListener('click', fecharAtualizacao);
});

async function buscarTodasAnotacoes(){
    if(db == undefined){
        console.log("O banco de dados está fechado.");
    }
    const tx = await db.transaction('anotacao', 'readonly');
    const store = await tx.objectStore('anotacao');
    const anotacoes = await store.getAll();
    if(anotacoes){
        const divLista = anotacoes.map(anotacao => {
            return `<div class="item">
                    <p>Anotação</p>
                    <p>${anotacao.titulo} - ${anotacao.data} </p>
                    <p>${anotacao.categoria}</p>
                    <p>${anotacao.descricao}</p>
                   </div>`;
        });
        listagem(divLista.join(' '));
    }
}

async function adicionarAnotacao() {
    let titulo = document.getElementById("titulo").value;
    let descricao = document.getElementById("descricao").value;
    let data = document.getElementById("data").value;
    let categoria = document.getElementById("categoria").value;
    const tx = await db.transaction('anotacao', 'readwrite')
    const store = tx.objectStore('anotacao');
    try {
        await store.add({ titulo: titulo, descricao: descricao, data: data, categoria:categoria });
        await tx.done;
        limparCampos();
        console.log('Registro adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar registro:', error);
        tx.abort();
    }
}

async function atualizarAnotacao(){
    const titulo = document.getElementById('tituloUpdate').value;
    const categoria = document.getElementById('categoriaUpdate').value;
    const data = document.getElementById('dataUpdate').value;
    const descricao = document.getElementById('descricaoUpdate').value;

    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');
    try {
        await store.put({ titulo: titulo, categoria: categoria, descricao: descricao, data: data });
        await tx.done;
        fecharAtualizacao();
        buscarTodasAnotacoes();
        console.log('Anotação atualizada com sucesso!');
    } catch (error) {
        console.error('Erro ao atualziar anotação:', error);
        tx.abort();
    }
}

function fecharAtualizacao() {
    document.getElementById('tituloUpdate').removeAttribute('readonly');
    document.getElementById('tituloUpdate').value = '';
    document.getElementById('categoriaUpdate').value = '';
    document.getElementById('dataUpdate').value = '';
    document.getElementById('descricaoUpdate').value = '';
    document.getElementById('updateForm').style.display = 'none';
}


async function removerAnotacao() {
    const tituloRemover = prompt('Qual anotação deseja excluir:');
    if (!tituloRemover) {
        console.log('Remoção cancelada.');
        return;
    }
    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');
    try {
        await store.delete(tituloRemover);
        await tx.done;
        console.log('Anotação excluída com sucesso!');
        buscarTodasAnotacoes();
    } catch (error) {
        console.error('Erro ao excluir anotação.', error);
        tx.abort();
    }
}

async function buscarAnotacao() {
    let busca = document.getElementById("busca").value;
    const tx = await db.transaction('anotacao', 'readonly');
    const store = tx.objectStore('anotacao');
    const index = store.index(titulo);
    const anotacoes = await index.getAll(IDBKeyRange.only(busca));
    if (anotacoes.length > 0) {
        const divLista = anotacoes.map(anotacao => {
            return `<div class="item">
            <p>Anotação</p>
            <p>Título: ${anotacao.titulo}</p>
            <p>Texto: ${anotacao.descricao}</p>
            <p>Data: ${anotacao.data}</p>
            <p>Categorias: ${anotacao.categoria}}</p>
            </div>`;
        });
        listagem(divLista.join(''));
    } else {
        listagem(`<p>Nenhuma anotação encontrada com esse nome.</p>`);
    }
}


function limparCampos() {
    document.getElementById("titulo").value = '';
    document.getElementById("descricao").value = '';
    document.getElementById("data").value = '';
    document.getElementById("categoria").value = '';
}

function listagem(text){
    document.getElementById('resultados').innerHTML = text;
}
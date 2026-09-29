import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import Swal from 'sweetalert2';
import { AssistidosComponent } from './assistidos.component';
import { UploadService } from '../../services/upload.service';
import { baseUrl } from '../../config/api';

describe('AssistidosComponent', () => {
  let fixture: ComponentFixture<AssistidosComponent>;
  let comp: AssistidosComponent;
  let http: HttpTestingController;
  let el: HTMLElement;
  let swal: jasmine.Spy;
  let upload: jasmine.SpyObj<UploadService>;

  const lista = [
    { id: 1, nome: 'Maria Silva', documento: '12345678901', data_nascimento: '1990-05-10T00:00:00.000Z', imagem: null },
    { id: 2, nome: 'Joao Souza', documento: '123456789', data_nascimento: null, imagem: null },
  ];

  const req = (method: string, sufixo: string): TestRequest =>
    http.expectOne((r) => r.method === method && r.url === `${baseUrl}${sufixo}`);
  const text = () => (el.textContent ?? '').replace(/\s+/g, ' ');
  const itens = () => el.querySelectorAll('.ast-item');
  const render = () => fixture.detectChanges();
  const botao = (rotulo: string, raiz: ParentNode = el) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => (b.textContent ?? '').trim() === rotulo) as
      | HTMLButtonElement
      | undefined;
  const carregar = (dados: any[] = lista) => {
    req('GET', '/assistido').flush(dados);
    render();
  };
  const buscar = (termo: string) => {
    const input = el.querySelector<HTMLInputElement>('#busca-assistido')!;
    input.value = termo;
    input.dispatchEvent(new Event('input'));
    render();
  };

  beforeEach(() => {
    upload = jasmine.createSpyObj<UploadService>('UploadService', ['uploadImage']);
    TestBed.configureTestingModule({
      imports: [AssistidosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: UploadService, useValue: upload }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AssistidosComponent);
    comp = fixture.componentInstance;
    el = fixture.nativeElement;
    swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));
    render();
  });

  afterEach(() => http.verify());

  it('mostra loading e depois a lista com documento formatado e ações com aria-label', () => {
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Carregando');
    carregar();
    expect(el.querySelector('[role="status"]')).toBeNull();
    expect(itens().length).toBe(2);
    expect(itens()[0].textContent).toContain('123.456.789-01');
    expect(itens()[1].textContent).toContain('12.345.678-9');
    const editar = itens()[0].querySelector('button.ec-btn--secondary')!;
    const excluir = itens()[0].querySelector('button.ec-btn--danger')!;
    expect(editar.getAttribute('aria-label')).toBe('Editar Maria Silva');
    expect(excluir.getAttribute('aria-label')).toBe('Excluir Maria Silva');
    expect(el.querySelector('label[for="busca-assistido"]')).not.toBeNull();
  });

  it('avatar decorativo: iniciais quando sem foto, foto quando houver', () => {
    carregar([
      { id: 1, nome: 'Maria da Silva', documento: '12345678901', imagem: null },
      { id: 2, nome: 'Joao', documento: '123456789', imagem: 'data:image/png;base64,AAAA' },
    ]);
    const [a1, a2] = Array.from(itens()).map((i) => i.querySelector('.ec-avatar')!);
    expect(a1.getAttribute('aria-hidden')).toBe('true');
    expect(a1.querySelector('img')).toBeNull();
    expect(a1.textContent?.trim()).toBe('MS');
    const img = a2.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('data:image/png;base64,AAAA');
    expect(img.getAttribute('alt')).toBe('');
  });

  it('lista vazia: "Nenhum assistido cadastrado"', () => {
    carregar([]);
    expect(text()).toContain('Nenhum assistido cadastrado');
    expect(text()).not.toContain('Nenhum resultado para a busca');
  });

  it('erro na lista mostra alerta e "Tentar novamente" recarrega', () => {
    req('GET', '/assistido').flush('x', { status: 500, statusText: 'Erro' });
    render();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível carregar os assistidos');
    botao('Tentar novamente')!.click();
    carregar();
    expect(itens().length).toBe(2);
  });

  it('busca por nome (sem diferenciar maiúsculas) e por documento com ou sem máscara', () => {
    carregar();
    buscar('maria');
    expect(itens().length).toBe(1);
    buscar('123.456');
    expect(itens().length).toBe(2);
    buscar('789-01');
    expect(itens().length).toBe(1);
    expect(itens()[0].textContent).toContain('Maria Silva');
    buscar('zzz');
    expect(itens().length).toBe(0);
    expect(text()).toContain('Nenhum resultado para a busca');
    botao('Limpar')!.click();
    render();
    expect(itens().length).toBe(2);
  });

  it('cadastrar: labels, payload, feedback, fechamento e recarga', () => {
    carregar();
    botao('Cadastrar assistido')!.click();
    render();
    const modal = el.querySelector('[role="dialog"][aria-labelledby="titulo-cadastrar"]')!;
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(el.querySelectorAll('.ec-backdrop').length).toBe(1);
    for (const id of ['nome', 'numero_documento', 'data_nascimento', 'foto']) {
      expect(modal.querySelector(`label[for="${id}"]`)).withContext(id).not.toBeNull();
    }
    comp.novoAssistido.nome = 'Ana';
    comp.novoAssistido.documento = '98765432100';
    comp.novoAssistido.data_nascimento = '2000-01-02';
    botao('Cadastrar', modal)!.click();
    const post = req('POST', '/assistido');
    expect(post.request.body).toEqual(
      jasmine.objectContaining({ nome: 'Ana', documento: '98765432100', data_nascimento: '2000-01-02' }),
    );
    post.flush({ id: 3 }, { status: 201, statusText: 'Created' });
    carregar();
    expect(swal.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ icon: 'success' }));
    expect(comp.mostrarModal).toBeFalse();
    expect(comp.novoAssistido.nome).toBe('');
  });

  it('erro no cadastro com err.error nulo: mensagem padrão e modal continua aberto com os dados', () => {
    carregar();
    comp.openModal();
    comp.novoAssistido.nome = 'Ana';
    comp.cadastrarAssistido();
    req('POST', '/assistido').error(new ProgressEvent('error'));
    render();
    expect(swal.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ title: 'Erro no cadastro', text: jasmine.stringMatching(/Tente novamente/) }),
    );
    expect(comp.mostrarModal).toBeTrue();
    expect(comp.novoAssistido.nome).toBe('Ana');
    expect(comp.isSalvando).toBeFalse();
  });

  it('editar: GET por id, data em yyyy-MM-dd, backdrop único e PUT com data ISO (formato original)', async () => {
    carregar();
    itens()[0].querySelector<HTMLButtonElement>('button.ec-btn--secondary')!.click();
    render();
    expect(comp.mostrarModalEditar).toBeFalse();
    req('GET', '/assistido/1').flush(lista[0]);
    render();
    await fixture.whenStable();
    render();
    const modal = el.querySelector('[role="dialog"][aria-labelledby="titulo-editar"]')!;
    expect(modal).not.toBeNull();
    expect(el.querySelectorAll('.ec-backdrop').length).toBe(1);
    expect(el.querySelectorAll('.modal-overlay').length).toBe(0);
    expect(modal.querySelector<HTMLInputElement>('#data_nascimento')!.value).toBe('1990-05-10');
    expect(modal.querySelector<HTMLInputElement>('#nome')!.value).toBe('Maria Silva');

    comp.atualizarAssistido.nome = 'Maria S.';
    botao('Atualizar', modal)!.click();
    const put = req('PUT', '/assistido/1');
    expect(put.request.body).toEqual({
      id: 1,
      nome: 'Maria S.',
      documento: '12345678901',
      data_nascimento: '1990-05-10T00:00:00.000Z',
      imagem: null,
    });
    put.flush({});
    carregar();
    expect(comp.mostrarModalEditar).toBeFalse();
  });

  it('falha no GET de edição mostra feedback e não abre o modal', () => {
    carregar();
    comp.openModalEditar(2);
    req('GET', '/assistido/2').flush(null, { status: 500, statusText: 'Erro' });
    render();
    expect(comp.mostrarModalEditar).toBeFalse();
    expect(comp.carregandoEdicaoId).toBeNull();
    expect(swal.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ title: 'Erro ao carregar assistido', icon: 'error' }),
    );
  });

  it('excluir: cancelar não chama a API; confirmar envia DELETE', async () => {
    carregar();
    itens()[1].querySelector<HTMLButtonElement>('button.ec-btn--danger')!.click();
    expect(swal.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ title: 'Tem certeza?', showCancelButton: true, confirmButtonText: 'Sim, excluir!' }),
    );
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'DELETE');

    swal.and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    comp.excluirAssistido(2);
    await fixture.whenStable();
    req('DELETE', '/assistido/2').flush({});
    await fixture.whenStable();
    req('GET', '/assistido').flush([lista[0]]);
  });

  it('upload em andamento desabilita o confirmar e mostra status acessível', async () => {
    carregar();
    let concluir!: (url: string) => void;
    upload.uploadImage.and.returnValue(new Promise<string>((r) => (concluir = r)));
    comp.openModal();
    render();
    const arquivo = new File(['x'], 'foto.png', { type: 'image/png' });
    const pendente = comp.onFileChangeCadastrar({ target: { files: [arquivo] } });
    render();
    expect(upload.uploadImage).toHaveBeenCalledWith(arquivo);
    expect(botao('Cadastrar')!.disabled).toBeTrue();
    expect(el.querySelector('.ast-upload[role="status"]')?.textContent).toContain('Enviando foto');
    concluir('https://exemplo/foto.png');
    await pendente;
    render();
    expect(botao('Cadastrar')!.disabled).toBeFalse();
    const img = el.querySelector<HTMLImageElement>('.ast-preview')!;
    expect(img.getAttribute('alt')).toContain('Foto de');
    expect(comp.novoAssistido.imagem).toBe('https://exemplo/foto.png');
  });

  it('Esc fecha o modal de cadastro', () => {
    carregar();
    comp.openModal();
    render();
    const modal = el.querySelector('[role="dialog"]')!;
    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    render();
    expect(comp.mostrarModal).toBeFalse();
  });
  it('campo de foto: label como botão, nome do arquivo escolhido e mesmo handler de upload', async () => {
    carregar();
    botao('Cadastrar assistido')!.click();
    render();
    const input = el.querySelector<HTMLInputElement>('#foto')!;
    const rotulo = el.querySelector<HTMLLabelElement>('label[for="foto"]')!;
    expect(rotulo.textContent).toContain('Escolher foto');
    expect(el.querySelector('#nome-foto')?.textContent).toContain('Nenhum arquivo selecionado');
    upload.uploadImage.and.returnValue(Promise.resolve('http://img/x.png'));
    const handler = spyOn(comp, 'onFileChangeCadastrar').and.callThrough();
    const dt = new DataTransfer();
    dt.items.add(new File(['x'], 'foto-maria.png', { type: 'image/png' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    render();
    expect(handler).toHaveBeenCalled();
    expect(el.querySelector('#nome-foto')?.textContent).toContain('foto-maria.png');
    expect(comp.novoAssistido.imagem).toBe('http://img/x.png');
    botao('Cancelar')!.click();
    render();
    botao('Cadastrar assistido')!.click();
    render();
    expect(el.querySelector('#nome-foto')?.textContent).toContain('Nenhum arquivo selecionado');
  });
});

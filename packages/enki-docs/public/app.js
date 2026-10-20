const dialog = document.querySelector('#search-dialog');
const input = document.querySelector('#search-input');
const status = document.querySelector('#search-status');
const results = document.querySelector('#search-results');
const menu = document.querySelector('.menu-toggle');
let indexPromise;
let searchVersion = 0;
const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
async function search() {
  const version = ++searchVersion;
  const query = normalize(input.value.trim());
  if (!query) {
    results.replaceChildren();
    status.textContent = 'Busque por uma tarefa, um recurso ou uma dúvida.';
    return;
  }
  status.textContent = 'Buscando…';
  try {
    indexPromise ??= fetch('/search.json').then((response) => {
      if (!response.ok) throw new Error('Busca indisponível');
      return response.json();
    });
    const pages = await indexPromise;
    if (version !== searchVersion) return;
    const terms = query.split(/\s+/);
    const matches = pages
      .map((page) => ({
        page,
        titleMatch: normalize(page.title).includes(query),
        matched: terms.every((term) =>
          normalize(`${page.title} ${page.description} ${page.body}`).includes(
            term,
          ),
        ),
      }))
      .filter((item) => item.matched)
      .sort((a, b) => Number(b.titleMatch) - Number(a.titleMatch))
      .slice(0, 12);
    results.replaceChildren(
      ...matches.map(({ page }) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        const title = document.createElement('strong');
        const description = document.createElement('span');
        a.href = `/${page.slug}`;
        title.textContent = page.title;
        description.textContent = page.description;
        a.append(title, description);
        li.append(a);
        return li;
      }),
    );
    status.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? 'guia encontrado' : 'guias encontrados'}`
      : 'Nenhum guia encontrado. Tente outra palavra, como “empresas” ou “acesso”.';
  } catch {
    indexPromise = undefined;
    status.textContent =
      'Não foi possível carregar a busca. Use o menu de guias ou tente novamente.';
  }
}
function openSearch() {
  dialog.showModal();
  input.focus();
  search();
}
document
  .querySelector('[data-open-search]')
  .addEventListener('click', openSearch);
document
  .querySelector('[data-close-search]')
  .addEventListener('click', () => dialog.close());
input.addEventListener('input', search);
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  }
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    openSearch();
  }
  if (event.key === 'Escape') {
    document.body.classList.remove('nav-open');
    menu.setAttribute('aria-expanded', 'false');
  }
});
menu.addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  menu.setAttribute('aria-expanded', String(open));
});
document.querySelector('main').addEventListener('click', () => {
  document.body.classList.remove('nav-open');
  menu.setAttribute('aria-expanded', 'false');
});

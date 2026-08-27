import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import Handlebars from 'handlebars';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';

const root = resolve(import.meta.dirname, '..');
const template = await readFile(resolve(root, 'src/templates/home.hbs'), 'utf8');
const supportTemplate = await readFile(resolve(root, 'src/templates/support.hbs'), 'utf8');

Handlebars.registerHelper('eq', (left, right) => left === right);
Handlebars.registerHelper('range', (length) => Array.from({ length }, (_, index) => index));

const render = Handlebars.compile(template, { noEscape: false });
const renderSupport = Handlebars.compile(supportTemplate, { noEscape: false });

for (const [file, content] of [
  ['index.html', hy],
  ['ru/index.html', ru]
]) {
  const output = resolve(root, file);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, render(content), 'utf8');
}

const supportPages = [
  ['privacy/index.html', { locale: 'hy', homeHref: '/', label: 'Իրավական նախագիծ', title: 'Գաղտնիության քաղաքականություն', copy: 'Այս դեմո տարբերակում հասցեն և հաշվի ֆայլը չեն ուղարկվում սերվեր։ Փաստաթուղթը պետք է իրավական ստուգում անցնի հրապարակումից առաջ։', back: 'Վերադառնալ գլխավոր էջ' }],
  ['terms/index.html', { locale: 'hy', homeHref: '/', label: 'Իրավական նախագիծ', title: 'Օգտագործման պայմաններ', copy: 'Կայքում ցուցադրված հաշվարկներն ու նախագծերը ցուցադրական օրինակներ են և չեն հանդիսանում առևտրային առաջարկ։', back: 'Վերադառնալ գլխավոր էջ' }],
  ['soon/index.html', { locale: 'hy', homeHref: '/', label: 'Շուտով', title: 'Այս բաժինը պատրաստվում է', copy: 'Մենք կառուցում ենք բիզնես լուծումների, բլոգի, փաստաթղթերի և MyEnergy անձնական հաշվի ամբողջական բաժինները։', back: 'Վերադառնալ գլխավոր էջ' }],
  ['ru/privacy/index.html', { locale: 'ru', homeHref: '/ru/', label: 'Юридический черновик', title: 'Политика конфиденциальности', copy: 'В этой демо-версии адрес и файл счёта не отправляются на сервер. Документ требует юридического согласования перед публикацией.', back: 'Вернуться на главную' }],
  ['ru/terms/index.html', { locale: 'ru', homeHref: '/ru/', label: 'Юридический черновик', title: 'Условия использования', copy: 'Расчёты и проекты на сайте являются демонстрационными примерами и не считаются коммерческим предложением.', back: 'Вернуться на главную' }],
  ['ru/soon/index.html', { locale: 'ru', homeHref: '/ru/', label: 'Скоро', title: 'Этот раздел готовится', copy: 'Мы готовим полноценные разделы для бизнеса, блога, документов и личного кабинета MyEnergy.', back: 'Вернуться на главную' }]
];

for (const [file, content] of supportPages) {
  const output = resolve(root, file);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, renderSupport(content), 'utf8');
}

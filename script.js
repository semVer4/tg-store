const { Pool } = require('pg');
const TelegramBot = require('node-telegram-bot-api');

const express = require('express');
const cors = require('cors');

const token = ''; 
//const webAppUrl = 'https://iridescent-capybara-241fae.netlify.app/';

const bot = new TelegramBot(token, { polling: true });

const app = express();

app.use(express.json());
app.use(cors());

const config = {
  host: process.env.HOST,
  port: process.env.PORT,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD
};

const pool = new Pool(config);

bot.onText(/\/setRole (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  pool.query(`UPDATE users SET role='${match[1]}'`);
  bot.sendMessage(chatId, `Ваша роль изменена на: ${match[1]}`);
});

bot.onText(/\/addCategories (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  pool.query(`
    INSERT INTO categories (name)
    VALUES ('${match[1]}')
  `);

  bot.sendMessage(chatId, `Категория ${match[1]} добавлена`);
});

bot.onText(/\/addProduct (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  let string = [];
  string.push(match[1].split(' '));
  
  const message = {
    categorie: '',
    product: ''
  };

  string.forEach(el => {
    message.categorie = el[0];
    message.product = el[1];
  });

  pool.query(`
    INSERT INTO products (name, categories)
    VALUES ('${message.product}', '${message.categorie}')
  `);

  bot.sendMessage(chatId, `Товар ${message.product} добавлен в категорию ${message.categorie}`);
});

bot.onText(/\/delCategories (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  pool.query(`DELETE FROM categories WHERE name='${match[1]}'`);

  bot.sendMessage(chatId, `Категория ${match[1]} удалена`);
});

bot.onText(/\/delProduct (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  pool.query(`DELETE FROM products WHERE name='${match[1]}'`);

  bot.sendMessage(chatId, `Товар ${match[1]} удален`);
});

bot.onText(/\/addInfo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  let string = [];
  string.push(match[1].split(' '));

  const info = {
    product: '',
    desc: match[1]
  };

  string.forEach(el => {
    info.product = el[0];
  });

  console.log(info.product);
  pool.query(`UPDATE products SET description='${info.desc}' WHERE name='${info.product}'`);
  bot.sendMessage(chatId, `Описание для товара ${info.product} успешно добавлено!`);
});

bot.onText(/\/editInfo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  let string = [];
  string.push(match[1].split(' '));

  const info = {
    product: '',
    desc: match[1]
  };

  string.forEach(el => {
    info.product = el[0];
  });

  console.log(info.product);
  pool.query(`UPDATE products SET description='${info.desc}' WHERE name='${info.product}'`);
  bot.sendMessage(chatId, `Описание для товара ${info.product} успешно изменено!`);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  console.log(msg);

  pool.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;

    for (let row of result.rows) {
        if (row.role == 'user') {
          if (text == '/start') {
            bot.sendMessage(chatId, 'Выберите действие по кнопке', {
              reply_markup: {
                  inline_keyboard: [
                    [{text: 'Все категории', callback_data: 'categories'}]
                ]
              }
            })
      
            pool.query(`
              INSERT INTO users (id, name, role)
              VALUES (1, '${msg.from.username}', 'user');
          `, (err) => {
            if (err) console.log('Test');
          });
        }        
      }
    }
  });

  pool.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;

    for (let row of result.rows) {
        if (row.role == 'admin') {
          if (text == '/start') {
            bot.sendMessage(chatId, 'Выберите действие по кнопке', {
              reply_markup: {
                  inline_keyboard: [
                    [{text: 'Добавить категорию', callback_data: 'addCategories'}],
                    [{text: 'Добавить товар', callback_data: 'addProduct'}],
                    [{text: 'Добавить описание товару', callback_data: 'addInfo'}],
                    [{text: 'Изменить описание товару', callback_data: 'editInfo'}],
                    [{text: 'Удалить категорию', callback_data: 'delCategories'}],
                    [{text: 'Удалить товар', callback_data: 'delProduct'}]
                ]
              }
            })
      
            pool.query(`
              INSERT INTO users (id, name, role)
              VALUES (1, '${msg.from.username}', 'user');
          `, (err) => {
            if (err) console.log('Test');
          });
        }        
      }
    }
  });

  if (text == '/categories') {
    pool.query('SELECT * FROM categories', async (err, result) => {
      if (err) throw err;
  
      for (let row of result.rows) {
        await bot.sendMessage(chatId, 'Выберите желаемую категорию по кнопке', {
          reply_markup: {
              inline_keyboard: [
                [{text: row.name, callback_data: row.name}]
            ]
          }
        }) 
      }
    })
  }

  if (text == '/addProduct') {
    pool.query('SELECT * FROM categories', async (err, result) => {
      if (err) throw err;
  
      for (let row of result.rows) {
        await bot.sendMessage(chatId, 'Выберите категорию для добавления товара по кнопке', {
          reply_markup: {
              inline_keyboard: [
                [{text: row.name, callback_data: row.name}]
            ]
          }
        }) 
      }
    })
  }
});

let categories = [];

pool.query('SELECT * FROM categories', (err, result) => {
  if (err) throw err;

  for (let row of result.rows) {
    categories.push(row.name);
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.from.id;

  switch (query.data) {
    case 'categories':
      await bot.sendMessage(chatId, 'Введите /categories');
    break;

    case 'addCategories':
      await bot.sendMessage(chatId, 'Введите /addCategories [название категории]');
    break;

    case 'addProduct':
      await bot.sendMessage(chatId, 'Введите /addProduct [название категории] [название товара]');
    break;

    case 'delCategories':
      await bot.sendMessage(chatId, 'Введите /delCategories [название категории]');
    break;

    case 'delProduct':
      await bot.sendMessage(chatId, 'Введите /delProduct [название товара]');
    break;

    case 'addInfo':
      await bot.sendMessage(chatId, 'Введите /addInfo [название товара] [описание товара]');
    break;

    case 'editInfo':
      await bot.sendMessage(chatId, 'Введите /editInfo [название товара] [описание товара]');
    break;
  }

  categories.forEach(el => {
    if (query.data == el) {
      pool.query('SELECT * FROM products', async (err, result) => {
        if (err) throw err;

        for (let row of result.rows) {
          if (row.categories == el) {
            await bot.sendMessage(chatId, `Все товары из категории ${row.categories}:  ${row.name}`);
            
            if (row.description == null) {
              await bot.sendMessage(chatId, 'У данного товара нет описания');
            } else {
              await bot.sendMessage(chatId, `Описание товара ${row.name}: ${row.description}`);
            }
          }
        }
      });
    }
  });
});
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { log } from "../../utils";
import config from "../../config";
import i18n from "../../i18n";
import templates from "../../templates";

const email = {};

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: 587,
  secure: false, // Only needed or SSL, not for TLS
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass
  }
});

const loadTemplate = (type, format, language) => {
  let template = templates.header[format]
    + templates[type][format]
    + templates.footer[format];
  let toTranslate = templates[type].i18n
    .concat(templates.footer.i18n);
  let from = [];
  let to = [];
  for (let key of toTranslate) {
    from.push(`__${key}__`);
    to.push(i18n[language][key] || key);
  }
  for(let id in from) template = template.replace(from[id], to[id]);

  return template;
}

const replace = (text, from, to) => {
  for(let id in from) text = text.replace(from[id], to[id] || from[id]);

  return text;
}


email.signup = (recipient, language, id) => {
  let html = loadTemplate("signup", "html", language);
  let text = loadTemplate("signup", "text", language);
  let from = [
    '__signupActionLink__',
    '__headerOpeningLine__',
    '__hiddenIntro__',
    '__footerWhy__',
  ];
  let to = [
    `${config.website}/${language}/confirm/${id}`,
    i18n[language].signupHeaderOpeningLine,
    i18n[language].signupHiddenIntro,
    i18n[language].signupWhy,
  ];
  html = replace(html, from, to);
  text = replace(text, from, to);

	let options = {
    from: `"${i18n[language].joostFromFreesewing}" <info@freesewing.org>`,
    to: recipient,
    subject: i18n[language].signupSubject,
    text,
    html
  };
	transporter.sendMail(options, (error, info) => {
    if (error) return console.log(error);
		console.log('Message sent', info);
  });
}

export default email;

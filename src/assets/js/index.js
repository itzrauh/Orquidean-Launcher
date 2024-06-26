/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */
const { ipcRenderer } = require('electron');
const os = require('os');
import { config, database } from './utils.js';

let dev = process.env.NODE_ENV === 'dev';


class Splash {
    constructor() {
        this.splash = document.querySelector(".splash");
        var audio = new Audio('assets/sound/start.ogg');
        audio.play();
        this.splashMessage = document.querySelector(".splash-message");
        this.splashAuthor = document.querySelector(".splash-author");
        this.message = document.querySelector(".message");
        this.progress = document.querySelector(".progress");
        document.addEventListener('DOMContentLoaded', async () => {
            let databaseLauncher = new database();
            let configClient = await databaseLauncher.readData('configClient');
            let theme = configClient?.launcher_config?.theme || "auto"
            let isDarkTheme = await ipcRenderer.invoke('is-dark-theme', theme).then(res => res)
            document.body.className = isDarkTheme ? 'dark global' : 'light global';
            if (process.platform == 'win32') ipcRenderer.send('update-window-progress-load')
            this.startAnimation()
        });
    }

    async startAnimation() {
        let splashes = [
            { "message": "Bananus Launcher by", "author": "itzrauh" },
            { "message": "el enano de blancanieves es", "author": "itzrauh" },
            { "message": "furulaa yey", "author": "itzrauh" },
            { "message": "te juro esto no es un virus", "author": "itzrauh" },
            { "message": "Si duermes en el nether recuperaras vida", "author": "Rey_de_Olimpia" },
            { "message": "A los monnos les gustan las bananas", "author": "Rey_de_Olimpia" },
            { "message": "la mejor defensa es huir", "author": "Rey_de_Olimpia" },
            { "message": "Si corres tendras hambre", "author": "Rey_de_Olimpia" },
            { "message": "si tienes hambre eres Boliviano", "author": "Rey_de_Olimpia" },
            { "message": "los esqueletos usan hacks", "author": "Rey_de_Olimpia" },
            { "message": "el pixelmon es basura", "author": "Rey_de_Olimpia" },
            { "message": "No pidas creativo pinche niño miado", "author": "Rey_de_Olimpia" },
            { "message": "que pendejo el que invento la palabra pendejo", "author": "josejuanglez" },
            { "message": "Arbol de abedul", "author": "octubram" },
            { "message": "hay pocos mods de comida", "author": "itzrauh" },
            { "message": "Larga vida al imperio Italiano", "author": "Rey_de_Olimpia" },
            { "message": "Debes comer e hidratarte", "author": "Rey_de_Olimpia" },
            { "message": "Ojala los colombianos invadan inglaterra", "author": "Rey_de_Olimpia" },
            { "message": "No se dice Octubram se dice octubre", "author": "Rey_de_Olimpia" },
            { "message": "No juegues pixelmon puto desgraciado", "author": "Rey_de_Olimpia" },
            { "message": "salsa de tomate", "author": "itzrauh" },
        ];
        let splash = splashes[Math.floor(Math.random() * splashes.length)];
        this.splashMessage.textContent = splash.message;
        this.splashAuthor.children[0].textContent = "@" + splash.author;
        await sleep(100);
        document.querySelector("#splash").style.display = "block";
        await sleep(500);
        this.splash.classList.add("opacity");
        await sleep(500);
        this.splash.classList.add("translate");
        this.splashMessage.classList.add("opacity");
        this.splashAuthor.classList.add("opacity");
        this.message.classList.add("opacity");
        await sleep(1000);
        this.checkUpdate();
    }

    async checkUpdate() {
        if (dev) return this.startLauncher();
        this.setStatus(`Buscando una actualización...`);

        ipcRenderer.invoke('update-app').then().catch(err => {
            return this.shutdown(`error al buscar una actualización :<br>${err.message}`);
        });

        ipcRenderer.on('updateAvailable', () => {
            this.setStatus(`¡Actualización disponible!`);
            ipcRenderer.send('start-update');
        })

        ipcRenderer.on('error', (event, err) => {
            if (err) return this.shutdown(`${err.message}`);
        })

        ipcRenderer.on('download-progress', (event, progress) => {
            this.toggleProgress();
            ipcRenderer.send('update-window-progress', { progress: progress.transferred, size: progress.total })
            this.setProgress(progress.transferred, progress.total);
        })

        ipcRenderer.on('update-not-available', () => {
            console.error("Actualización no disponible.");
            this.maintenanceCheck();
        })
    }

    async maintenanceCheck() {
        config.GetConfig().then(res => {
            if (res.maintenance) return this.shutdown(res.maintenance_message);
            this.startLauncher();
        }).catch(e => {
            console.error(e);
            return this.shutdown("No se detectó ninguna conexión a Internet.<br>Vuelve a intentarlo más tarde.");
        })
    }

    startLauncher() {
        this.setStatus(`Iniciando el launcher.`);
        ipcRenderer.send('main-window-open');
        ipcRenderer.send('update-window-close');
    }

    shutdown(text) {
        this.setStatus(`${text}<br>Apagando en 5s`);
        let i = 4;
        setInterval(() => {
            this.setStatus(`${text}<br>Apagando en ${i--}s`);
            if (i < 0) ipcRenderer.send('update-window-close');
        }, 1000);
    }

    setStatus(text) {
        this.message.innerHTML = text;
    }

    toggleProgress() {
        if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
    }

    setProgress(value, max) {
        this.progress.value = value;
        this.progress.max = max;
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
        ipcRenderer.send("update-window-dev-tools");
    }
})
new Splash();
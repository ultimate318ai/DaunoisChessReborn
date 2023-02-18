/**
 * This module stands for language translation tools.
 */

type LanguageKey = keyof typeof languages;

const languages : { [key: string]: {[key: string]: string}  } = {

    fr: {
        about: "A Propos",
        chess: "Jeu d'Echec",
        latex: "Latex",
        welcome: "Soyez les bienvenus sur mon site !"
    },
    eng: {
        about: "About",
        chess: "Chess Game",
        latex: "Latex",
        welcome: "Welcome to my website !"
    }
};

function getTranslatableElements() : NodeListOf<Element> {
    /**
     * This function is used to take all the "translate"
     * class element and change their language
     * @return a list of all the elements.
     */
    return document.querySelectorAll(".translate");
}

function translateAll() : void {
    /**
     * Translate the elements in page in the language selected.
     */
    let select: HTMLSelectElement = document.getElementById("language") as HTMLSelectElement;
    if (select == null){
        return
    }
    const language : LanguageKey = select.options[select.selectedIndex].text as LanguageKey
    getTranslatableElements().forEach((element) => {
        let id: LanguageKey = element.getAttribute("id") as LanguageKey;
        if (id !== undefined) {
            element.setAttribute("text", languages[language][id]);
        }
    });
}
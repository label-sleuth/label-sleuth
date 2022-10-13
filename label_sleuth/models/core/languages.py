#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

from dataclasses import dataclass
from typing import Sequence


@dataclass
class Language:
    """
    This dataclass contains some parameters that are language-specific. The parameter values can be used by the
    classification model implementations, as well as by some general utility functions in the *analysis_utils* module.
    """
    name: str
    stop_words: Sequence[str]
    spacy_model_name: str

    def __repr__(self):
        return self.name


English = \
    Language(name='English',
             stop_words=["a", "about", "above", "after", "again", "against", "ain", "all", "am", "an", "and", "any",
                         "are", "aren", "aren't", "as", "at", "be", "because", "been", "before", "being", "below",
                         "between", "both", "but", "by", "can", "couldn", "couldn't", "d", "did", "didn", "didn't",
                         "do", "does", "doesn", "doesn't", "doing", "don", "don't", "down", "during", "each", "few",
                         "for", "from", "further", "had", "hadn", "hadn't", "has", "hasn", "hasn't", "have", "haven",
                         "haven't", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
                         "i", "if", "in", "into", "is", "isn", "isn't", "it", "it's", "its", "itself", "just", "ll",
                         "m", "ma", "me", "mightn", "mightn't", "more", "most", "mustn", "mustn't", "my", "myself",
                         "needn", "needn't", "no", "nor", "not", "now", "o", "of", "off", "on", "once", "only", "or",
                         "other", "our", "ours", "ourselves", "out", "over", "own", "re", "s", "same", "shan", "shan't",
                         "she", "she's", "should", "should've", "shouldn", "shouldn't", "so", "some", "such", "t",
                         "than", "that", "that'll", "the", "their", "theirs", "them", "themselves", "then", "there",
                         "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "ve", "very",
                         "was", "wasn", "wasn't", "we", "were", "weren", "weren't", "what", "when", "where", "which",
                         "while", "who", "whom", "why", "will", "with", "won", "won't", "wouldn", "wouldn't", "y",
                         "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
                         "could", "he'd", "he'll", "he's", "here's", "how's", "i'd", "i'll", "i'm", "i've", "let's",
                         "ought", "she'd", "she'll", "that's", "there's", "they'd", "they'll", "they're", "they've",
                         "we'd", "we'll", "we're", "we've", "what's", "when's", "where's", "who's", "why's", "would"],
             spacy_model_name='en_core_web_lg')

Italiano = \
    Language(name='Italiano',
             stop_words=["scola", "varie", "saro", "stanno", "dagli", "certa", "le", "nemmeno", "molto", "avuti", 
							"posteriore", "facesse", "il", "nostra", "durante", "faceste", "dalla", "può", "della", "ora", "faccia", 
							"alla", "dice", "scorso", "probabilmente", "volta", "sareste", "tre", "fu", "dell", "quanta", "soltanto", 
							"fa", "degl", "diventare", "pure", "quantunque", "che", "anche", "pieno", "nostri", "te", "facessero", 
							"qualunque", "codesti", "nonsia", "come", "successivamente", "stato", "mesi", "quelle", "insieme", "agli", 
							"volte", "faresti", "nell", "lui", "ma", "malgrado", "ossia", "allo", "lato", "mi", "aveste", "lo", "molti", 
							"basta", "seguito", "dallo", "cioe", "giacche", "avevate", "starebbero", "parecchio", "ansa", "paese", 
							"partendo", "secondo", "prima", "gliela", "quale", "là", "uno", "vari", "facciamo", "dove", "sarà", "stati", 
							"medesimo", "steste", "male", "stiate", "facciano", "ahime", "dovrà", "tra", "stessero", "osi", "esse", 
							"seguente", "stavo", "percio", "sarebbe", "avrai", "parecchie", "codesto", "dall", "cominci", "tempo", "sui", 
							"relativo", "faremo", "aver", "staremo", "citta", "dei", "improvviso", "stesse", "verso", "generale", "po", 
							"avreste", "mie", "parecchi", "fuori", "uguali", "gruppo", "queste", "contro", "diventato", "col", "così", 
							"puo", "sarete", "quindi", "anni", "si", "stavamo", "mediante", "eravamo", "state", "stettero", "sto", 
							"colui", "facesti", "lungo", "altro", "fareste", "fummo", "agl", "solito", "certe", "abbia", "ai", "faremmo", 
							"stavano", "perfino", "no", "quelli", "certo", "miei", "feci", "fossi", "presa", "purtroppo", "con", 
							"facevi", "chi", "momento", "concernente", "stiamo", "ecc", "saremo", "successivo", "una", "per", "coloro", 
							"governo", "nessuno", "dappertutto", "conclusione", "fra", "farà", "glieli", "sotto", "salvo", "dentro", 
							"altri", "sarebbero", "fece", "tutto", "quel", "effettivamente", "luogo", "alle", "essi", "ti", "ella", 
							"sembrare", "casa", "foste", "fatto", "sarò", "starò", "la", "avuta", "tu", "codesta", "in", "sugl", 
							"staresti", "starà", "fanno", "starete", "mila", "degli", "stesti", "avute", "voi", "esser", "finalmente", 
							"avemmo", "ebbe", "peggio", "cosa", "nondimeno", "maggior", "lei", "grande", "bene", "avevo", "ore", "stava", 
							"nello", "stiano", "allora", "farò", "infatti", "sembrato", "dirimpetto", "nella", "me", "ero", "piglia", 
							"altrove", "nel", "saremmo", "ho", "entrambi", "ognuno", "altrimenti", "tanto", "avranno", "dal", 
							"recentemente", "tali", "sulle", "tua", "dovunque", "farebbe", "sei", "avessimo", "pero", "avremmo", "coll", 
							"facevate", "spesso", "avevano", "cio", "niente", "inoltre", "ancora", "otto", "li", "abbastanza", "varia", 
							"qualcuno", "vale", "già", "ieri", "vostra", "cento", "facemmo", "stette", "faceva", "persone", "avevamo", 
							"ci", "troppo", "però", "dunque", "sulla", "avrete", "all", "vi", "piuttosto", "saresti", "stessi", 
							"ottanta", "bravo", "sia", "ed", "proprio", "intanto", "quello", "nelle", "chiunque", "facevano", "visto", 
							"colei", "miliardi", "avrei", "press", "invece", "nulla", "ahimè", "altrui", "se", "sono", "sua", "gliele", 
							"consiglio", "ulteriore", "peccato", "recente", "tuoi", "lavoro", "frattempo", "avrà", "qualcosa", "eppure", 
							"sopra", "stando", "forza", "fossero", "attraverso", "nonostante", "gliene", "dai", "negli", "farete", 
							"moltissimo", "poiche", "sempre", "quante", "noi", "sembri", "dietro", "marche", "poco", "loro", "nei", 
							"vostre", "giorno", "ad", "città", "deve", "novanta", "oltre", "eri", "grazie", "milioni", "quest", 
							"talvolta", "cui", "glielo", "dalle", "lasciato", "certi", "facessi", "solo", "avrebbero", "essendo", 
							"quanti", "stia", "hai", "stemmo", "via", "dov", "staremmo", "avente", "nove", "perciò", "quella", "mai", 
							"tuo", "nostre", "lontano", "ex", "nostro", "ciascuno", "fino", "perché", "ultimo", "faranno", "ha", "inc", 
							"perche", "al", "ognuna", "sara", "modo", "ciascuna", "faccio", "qui", "chicchessia", "cos", "mentre", 
							"adesso", "sig", "hanno", "cosi", "avrò", "persino", "dovra", "avresti", "facendo", "favore", "benissimo", 
							"stareste", "sul", "da", "stata", "co", "quanto", "tale", "facessimo", "avanti", "dagl", "tuttavia", "farai", 
							"quando", "avendo", "preferibilmente", "avremo", "starebbe", "finche", "caso", "stetti", "malissimo", 
							"essere", "giorni", "stesso", "vostri", "vario", "trenta", "ecco", "fosti", "stai", "ne", "mia", "furono", 
							"vita", "sarei", "poi", "anticipo", "delle", "tranne", "principalmente", "coi", "stavate", "potrebbe", 
							"farei", "siete", "brava", "fin", "cima", "attesa", "stavi", "del", "fecero", "avesse", "forse", "detto", 
							"gia", "farebbero", "avessero", "saranno", "minimi", "piu", "senza", "starei", "sarai", "possedere", "non", 
							"pochissimo", "un", "primo", "piedi", "davanti", "titolo", "od", "uomo", "stessimo", "mio", "negl", "tutte", 
							"avrebbe", "suo", "fossimo", "fai", "io", "mosto", "parte", "facevo", "questa", "facevamo", "tutta", "sette", 
							"gli", "fui", "scopo", "vostro", "fine", "fosse", "trovato", "nessuna", "qualcuna", "riecco", "cogli", "sta", 
							"possa", "ebbero", "su", "avete", "fare", "nuovo", "posto", "a", "realmente", "meno", "registrazione", 
							"quasi", "mondo", "sullo", "comunque", "siano", "dopo", "esempio", "avevi", "siamo", "avesti", "nessun", 
							"tue", "va", "cortesia", "intorno", "questi", "ministro", "anno", "alcuni", "sugli", "tutti", "srl", 
							"diventa", "subito", "nazionale", "siate", "ebbi", "sue", "alcuna", "abbiate", "mezzo", "due", "meglio", 
							"eravate", "ogni", "macche", "dello", "magari", "più", "alcuno", "questo", "avere", "oggi", "vicino", 
							"futuro", "circa", "staranno", "stessa", "di", "avuto", "haha", "assai", "starai", "abbiamo", "era", 
							"oppure", "quali", "accidenti", "abbiano", "suoi", "egli", "neppure", "averlo", "qualche", "sull", "avessi", 
							"quattro", "facciate", "dire", "mancanza", "affinche", "erano", "conciliarsi", "sembra", "aveva"],
             spacy_model_name='it_core_news_lg')


class Languages:
    ENGLISH = English
    ITALIANO = Italiano

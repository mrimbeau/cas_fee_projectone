/* ENUM SortCriteria noteList */
import compile = Handlebars.compile;
enum SortCriteria {
    id,
    dueDate,
    creationDate,
    importance,
}
/* ENUM FilterCriteria notelist */
enum FilterCriteria {
    id,
    noteActive,
    noteHighImportance,
    noteMediumImportance,
    noteLowImportance
}

/* Handlebars Helper */

/* Rate transformiert den Score (Ausprägung des Ratings) in HTML
 Der gültige Wertebereich beträgt 0 bis BESTRATING.
 Wird ein ungüliger Wert übergeben, wird die class error-sign generiert*/

Handlebars.registerHelper('rate', function (rating:number) {
    var RatingHTML:string = "";
    const BESTRATING:number = 5;
    if (rating >= 0 && rating <= BESTRATING) {
        for (let i = 1; i <= BESTRATING; i++) {
            if (rating >= i) {
                RatingHTML = RatingHTML + '<span class="scored-sign">&nbsp;</span>';
            } else {
                RatingHTML = RatingHTML + '<span class="unscored-sign">&nbsp;</span>';
            }
        }
    }
    else {
        const ERRORSIGNSPAN:string = '<span class="error-sign">&nbsp;</span>';
        for (let i = 1; i <= BESTRATING; i++) {
            RatingHTML = RatingHTML + ERRORSIGNSPAN;
        }
    }

    return new Handlebars.SafeString(RatingHTML);
});

/* ToDo: insert Prefix */
Handlebars.registerHelper('showdate', function (date:string, prefixText:string) {
    const DATEFORMAT:string = "LL";
    let outDate:string = "";
    if (moment(date).isValid()) {
        outDate = moment(date).format(DATEFORMAT);
    }
    else {
        outDate = "";
        console.log("Invalid Date: " + moment(date));
    }

    return new Handlebars.SafeString(outDate);
});

/* Notelistview Classes */
class Notelistview {
    noteListTemplateHTML:HandlebarsTemplateDelegate;

    constructor() {
        this.compile();
    }

    render(notelist:INote[]):void {
        let context = {
            notes: notelist
        };
        let notesHtml:string = this.noteListTemplateHTML(context);
        document.getElementById("notelist").innerHTML = notesHtml;
    }

    private compile():void {
        this.noteListTemplateHTML = Handlebars.compile(document.getElementById("notes-template").innerText);
    }

}
class NotelistController extends NoteController{
    notelist:INote[];
    notelistview:Notelistview;
    noteservice:NoteService;
    noteStorageService:NoteStorageService;

    /* HTMLSelectElement greift auf das Interface von HTMLElement zurück */
    /* Aktives Filter- und Sortierkriterium über Listboxen
     Default ist das Item, das ausgewählt wurde */
    /* ToDo: Services im constructor übergeben Hinweis Michael */
    constructor() {
        super(HREF_PREFIX_STYLE);
        this.noteservice = new NoteService();
        this.noteStorageService = new NoteStorageService();
        this.notelist = this.noteStorageService.noteList;
        this.notelistview = new Notelistview();
        this.notelistview.render(this.notelist);
        this.registerBtnEdit();
        this.registerBtnNoteNew();
        this.registerCBFinished();
        this.registerListboxSorter();
        this.registerListboxFilter();
    };

    registerCBFinished():void {
        $(":checkbox").change(function () {
            let  id = $(this).parent().attr("id");
            let finishedDate = $(this).is(':checked') ? new Date().toJSON() : " ";
            let note:INote = new Note();
            note.id = Number(id);
            new NoteStorageService().updateNote(note, finishedDate);
        })
    }

    registerBtnEdit():void {
        $(":button").on('click', function () {
            let id = $(this).parent().attr("id");
            NotelistController.changLocation(Number(id));
        });
    }

    registerBtnNoteNew():void {
        let el:HTMLElement = document.getElementById("btnNoteNew");
        el.addEventListener('click', this.createNewNote.bind(this));
    }

    registerListboxSorter():void {
        let el:HTMLElement = document.getElementById("ddlb_sorterselect");
        el.addEventListener('change', this.sort.bind(this));
    }

    registerListboxFilter():void {
        let el:HTMLElement = document.getElementById("ddlb_filterselect");
        el.addEventListener('change', this.filter.bind(this));

    }

    createNewNote(event:Event):void {
        let nextID:number = 1;
        console.log("NewNote", Event);

        nextID = this.noteStorageService.getNextId();
        if (typeof nextID === "number") {
            /* notedetail Editor mit neuer ID aufrufen */
            NotelistController.changLocation(nextID);
        }
        else {
            console.log("Error:CreateNewNote: Wrong ID", nextID);
        }
    }

    private static changLocation(id:number):void {
        window.location.replace("notedetail\\notedetail.html?id=" + id);
    }

    sort(event:Event):void {
        /* found no type for event.target therefore any as type */
        let target:any = event.target;
        let SelectedSortOption:string = target.value;
        switch (SelectedSortOption) {
            case "id":
                this.noteservice.sortBy(this.notelist, SortCriteria.id);
                break;
            case "due-date":
                this.noteservice.sortBy(this.notelist, SortCriteria.dueDate);
                break;
            case "creation-date":
                this.noteservice.sortBy(this.notelist, SortCriteria.creationDate);
                break;
            case "importance":
                this.noteservice.sortBy(this.notelist, SortCriteria.importance);
                break;
            default:
                console.log("Switch SelectedSortOption: default");
                break;
        }
        this.notelistview.render(this.notelist);
        console.log("change LBSort");
    }

    filter(event:Event):void {
        let target:any = event.target;
        let SelectedSortOption:string = target.value;
        /* Noteliste mit allen Elementen initialisieren   */
        this.notelist = this.noteservice.getNotesfromStorage();
        switch (SelectedSortOption) {
            case "id":
                /* Kein Filter */
                break;
            case "note-active":
                this.notelist = this.noteservice.filterBy(this.notelist, FilterCriteria.noteActive);
                break;
            case "note-highimportance":
                this.notelist = this.noteservice.filterBy(this.notelist, FilterCriteria.noteHighImportance);
                break;
            case "note-mediumimportance":
                this.notelist = this.noteservice.filterBy(this.notelist, FilterCriteria.noteMediumImportance);
                break;
            case "note-lowimportance":
                this.notelist = this.noteservice.filterBy(this.notelist, FilterCriteria.noteLowImportance);
                break;
            default:
                console.log("Switch SelectedSortOption: default");
                break;
        }
        this.notelistview.render(this.notelist);
        console.log("change LBFilter");
    }

    /*    ToDo: Auf den ChangeEvent der beiden Listboxen, das Sortierkriterium und das Filterkriterium neu setzen
     und dann das notelistarray neu sortieren. Arrow-Funktion verwenden*/
}

/* App.Ctrl */
$(document).ready(function () {
    var notelistctrl = new NotelistController();
    //  notelistctrl.noteStorageService.initNoteList();
});

'use strict';
//import {Note} from "./Note"; // needs System.js
//import {NOTE_LIST, DATE_FORMAT, ServerNoteStorageService, Utility} from "./NoteDetail";
//require("./Note");
//require("./NoteDetail");

class NoteDetailView {

    private note:INote;

    constructor(aNote:INote) {
        this.note = aNote;
        this.render();
    }

    private render():void {
        if (this.note !== undefined && this.note !== null) {
            var dueDate = moment(this.note.dueDate).format(DATE_FORMAT);
            $("#note-id").val(this.note.id);
            $("#note-title").val(this.note.title);
            $("#note-description").val(this.note.description);
            $("#star" + this.note.importance).prop("checked", true);
            $("#note-createdDate").val(this.note.createdDate);
            $("#note-dueDate").val(dueDate);
            $("#note-finishedDate").val(this.note.finishedDate);
        }
    };
}

class NoteDetailController extends StyleController {
    private noteStorageService:INoteStorageService;
    private noteDetailView:NoteDetailView;
    private note:INote;

    constructor(aNoteStorageService:INoteStorageService) {
        super(HREF_PREFIX_DARKSYTLE);
        this.noteStorageService = aNoteStorageService;
        this.init();
        this.noteDetailView = new NoteDetailView(this.note);
        this.registerEvenListener();
    }

    private init():void {
        let noteId:String = Utility.getURLParameter("id");
        if (noteId !== null) {
            this.note = this.noteStorageService.getNote(Number(noteId));
        }
    }

    private registerEvenListener():void {
        $("#btnNoteReset").on('click', () => location.replace("noteDetail.html"));
        $("#btnBack").on('click', () => location.replace("..\\index.html"));
        $("#btnNoteSave").on('click', ()=> {
            if ($('form').is(':valid')) {
              //  event.preventDefault(); // prevent reloading the page
                let note:INote = DomToNoteMapper.map();
                this.noteStorageService.saveOrUpdateNote(note);
            }
        });
    }
}

/* Main */
$(document).ready(function () {
    let app = new App(StorageTyp.ServerNoteStorageService);
    if (app.storagetyp === StorageTyp.ServerNoteStorageService) {
        let noteStorageService = new ServerNoteStorageService();
        noteStorageService.getNotesfromServer(function () {
            new NoteDetailController(noteStorageService);
        });
    }else{//localStorage synchron
        if (app.isLocalStorageAvailable()) {
            let noteStorageService = new LocalNoteStorageService();
            new NoteDetailController(noteStorageService);
        }
        else {
            console.log ("No Local Storage")
        }
    }
});

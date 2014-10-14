	var express = require('express'),
	app = module.exports = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	ent = require('ent'),
	url = require('url'),
	querystring = require('querystring'),
	fs = require('fs'),
	jf = require('jsonfile'),
	util = require('util'),
	csv = require('ya-csv'),
	json2csv = require('json2csv'),
  json2csv = require('json2csv');
  mongoose = require('mongoose');
  mongoose.connect('mongodb://localhost/calendar');

	app.use(express.cookieParser('connect'));
	app.use(express.bodyParser());
  var profSchema = mongoose.Schema({name: String});
var Prof = mongoose.model('Prof', profSchema);

var coursSchema = mongoose.Schema({
  ue: String,
  numero: String,
  titre: String,
  type: String,
  nb_heures: Number,
  longueur: Number,
  groupes: Number,
  prof: {type: mongoose.Schema.Types.ObjectId, ref:'Prof'}
});
var Cours = mongoose.model('Cours', coursSchema);


	function getWeekNumber(maDate){
		var d = new Date(maDate.getFullYear(), maDate.getMonth(), maDate.getDate(), 0, 0, 0);
		var DoW = d.getDay();
        d.setDate(d.getDate() - (DoW + 6) % 7 + 3); // Nearest Thu
        var ms = d.valueOf(); // GMT
        d.setMonth(0);
        d.setDate(4); // Thu in Week 1
        return Math.round((ms - d.valueOf()) / (7 * 864e5)) + 1;
      }
      app.get('/save.json', function (req, res) {
       var contenu;
       var last_revision;
       last_revision = fs.readFileSync("last_revision");
       contenu = fs.readFileSync("./save/"+last_revision);
       res.end(contenu);
     });


      app.get('/', function (req, res) {
       if (req.cookies.login == "Guest"){
        res.sendfile(__dirname + '/index_guest.html');
        console.log("Guest detected ");
      } else {
        if(req.cookies.login){
         res.sendfile(__dirname + '/index.html');
         console.log("Admin detected");
       }	else {
         res.render('login.ejs');
       }	
     }

   });

      app.get('/print', function(req, res){
       res.sendfile(__dirname + '/print.html');
     })

      app.post('/form',function (req, res){
       var file = fs.readFileSync('./config_auth.json');
       var ret_file = JSON.parse(file, null);
       if(req.body.username == "prof" && req.body.password =="prof") {
        console.log('Guest detected');
        var minute = 60 * 120 * 1000;
        res.cookie('login', "Guest", { maxAge: minute });
        res.redirect('/');
      } else {
        if(req.body.username==ret_file.username && req.body.password==ret_file.password){
         console.log('Authenfication OK, création cookie');
         var minute = 60 * 120 * 1000;
         res.cookie('login', req.body.username, { maxAge: minute });
         res.redirect('/');
       } else {
         res.end('Acces Interdit');
         console.log("Acces refusé");
       }
     }
   });
      app.get('/logout', function(req, res){
       res.clearCookie('login');
       res.redirect('/');
     })
      .get('/fullcalendar/:css', function (req, res) {
       res.sendfile(__dirname + '/fullcalendar/'+req.params.css);
     })
      .get('/lib/:fichier', function (req, res) {
       res.sendfile(__dirname + '/lib/'+req.params.fichier);
     }).get('/print.html', function (req, res) {
       res.sendfile(__dirname + '/print.html');
     })
     .get('/images/:img', function (req, res) {
       res.sendfile(__dirname + '/images/'+req.params.img);
     })
     .get('/css/:css', function (req, res) {
       res.sendfile(__dirname + '/css/'+req.params.css);
     })
     .get('/fonts/:font', function (req, 
       res) {
       res.sendfile(__dirname + '/fonts/'+req.params.font);
     })
     .get('/cours.json', function(req,res){
       res.sendfile(__dirname + '/cours.json');
     })
     .get('/export',function(req,res){




       var contenu;
       var last_revision;

       var header = "CT_EVENT\n"+
       "_event_id,_day_of_week,_start_time,_end_time,_weeks,_break_mins,_spanName,_event_catName,_tag1,_tag2,_capacity_req,_deptName,_global_event,_protected,_suspended,_grouping_id,_registers_req,_lock,_resType,_resName,_resWeeks,_layoutName,_scheduling_status,_quantity\n";
       last_revision = fs.readFileSync("last_revision");
       var file = fs.readFileSync("./save/"+last_revision);
       var ret_file = JSON.parse(file, null);
       json2csv({data: ret_file, fields: ['title', 'start', 'end','prof','type_cours','titre','id_mat','groupe']}, function(err, csv) {
        if (err) console.log(err);
        fs.writeFile('file.csv', csv, function(err) {
          if (err) throw err;
        });
      });
       var reader = csv.createCsvFileReader('file.csv', {'separator': ',','quote': '"','escape': '"', 'comment': '',});
       var title = '',
       date_begin = '',
       date_end = '',
       prof = '',
       type = '',
       titre = '',
       id_mat = '',
       groupe = '';
       var fichier = "";
       reader.addListener('data', function(data) {
        title = data[0];
        date_begin = data[1];
        date_end = data[2];
        prof = data[3];
        type = data[4];
        titre = data[5];
        id_mat = data[6];
        groupe = data[7];
        if(type !="type_cours" && prof !="prof" && title !="CT_EVENT" && date_begin != "_day_of_week" && date_end != "_start_time"){
           var date_begin = new Date(date_begin);
           var date_end = new Date(date_end);
           var heure_begin = date_begin.getHours()+":"+date_begin.getMinutes();
           var heure_end = date_end.getHours()+":"+date_end.getMinutes();
           var tab_jour=new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
           if(groupe != 0){
            groupe = 'T2-G'+groupe;
           } else {
            groupe = 'T2';
           }


           fichier = fichier+Math.floor(Math.random() * (150000 - 145000 + 1)) + 145000+","+tab_jour[date_begin.getDay()]+","+heure_begin+","+heure_end+","+getWeekNumber(date_begin)+",0,,,,,,,N,N,N,,,\n"
           + ",,,,,,,,,,,,,,,,,,"+type+","+id_mat+" "+titre+",,,,\n"
           + ",,,,,,,,,,,,,,,,,,Group,"+groupe+",,,,\n"
           + ",,,,,,,,,,,,,,,,,,Staff,\""+prof+"\",,,,\n";
           console.log(groupe);
       } 

  console.log(fichier);
       fs.writeFile('export.csv', header+fichier, function(err) {
         if (err) console.log(err);
       });
     });
          res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
       var file2 = fs.readFileSync("./export.csv");

 res.end("Fichier sauvé et  disponible : <a href='./export.csv'>ici</a><br /><textarea  cols='120' rows='30'>"+file2+"</textarea>");



})
  .get('/export.csv',function(req,res){
    res.sendfile(__dirname + '/export.csv');
  })
  .get('/revision/index.html',function(req,res){
    var table_of_content = new Array();
    var last_revision;
    last_revision = fs.readFileSync("last_revision");
    fs.readdir("./save/",function(error,directoryObject){
     for(var i in directoryObject){
      table_of_content.push(directoryObject[i]);
    }
    res.render('revision.ejs', {last_revision:last_revision,revision:table_of_content,nb_revison: table_of_content.length-1});
  });

  })
  .get('/revision/:rev',function(req,res){
    fs.writeFileSync('last_revision',req.params.rev);
    res.render('revision_ok.ejs',{rev:req.params.rev});

  });



  io.sockets.on('connection', function (socket, data) {

    socket.on('save', function(data) {
     var date = new Date();
     var current_hour = date.getHours();
     var current_minute = date.getMinutes();
     var current_second = date.getSeconds();
     var current_day = date.getDay();
     var current_month = date.getMonth();
     var current_year = date.getFullYear();
     var file_name = current_year+'-'+current_month+'-'+current_day+'-'+current_hour+'-'+current_minute+'-'+current_second+'.json';

     fs.writeFileSync('./save/'+file_name, data);
     fs.writeFileSync('last_revision',file_name);
     socket.emit('save_ok');
   });
  });

// Gestion des cours et professeurs
app.get('/gestion', function(req, res){
  listeProfs = new Prof();

  Prof.find()
  .exec(function(err, liste){
    if(err) console.error(err);
    else {
      Cours.find()
      .populate('prof', 'name')
      .exec(function(err, listeCours){
        if(err) console.error(err);
        else{
          console.log(listeCours);
          res.render('gestion.ejs', {listeProfs: liste, listeCours: listeCours});
        }
      })
    }
  })
});

app.get('/profs/delete/:id', function(req, res){
  Cours.remove({ prof: req.params.id}, function(err){
    return console.log(err);
  });

  Prof.remove({ _id: req.params.id}, function(err){
    console.log(err);
  });
  res.redirect('/gestion');
});

app.post('/profs/add', function(req, res){
  var nom = req.body.prof;
  
  var newProf = new Prof({name: nom});

  nombre = Prof.count({name: nom}, function (err, nombre) {
    if (err) return console.error(err);
    if(nombre == 0){
    newProf.save(function (err, newProf) {
      if (err) 
        return console.log(err);
      else{
        res.redirect('/gestion');
      }
    });
    }
  });
});


app.post('/cours/add', function(req, res){
  var ue = req.body.ue;
  var titre = req.body.nom;
  var numero = req.body.numero;
  var type = req.body.type;
  var nb_heures = req.body.duree;
  var longueur = req.body.longueur;
  var groupes = req.body.groupes;
  var id_prof = req.body.prof;
  
  var newCours = new Cours({
    ue: ue,
    numero: numero, 
    titre: titre,
    type: type,
    nb_heures: nb_heures,
    longueur: longueur,
    groupes: groupes,
    prof: id_prof
    });

      newCours.save(function (err, newCours) {
      if (err) 
        return console.log(err);
      else{
        res.redirect('/gestion');
      }
    });

});

app.get('/cours/delete/:id', function(req, res){

  Cours.remove({_id: req.params.id}, function(err){
    return console.log(err);
  });
  res.redirect('/gestion');

})

.get('/cours', function(req, res){


    Cours.find()
    .populate('prof', 'name')
    .lean()
    .sort('ue numero')
    .exec(function(err, results){
      res.end(JSON.stringify(results));
    })



})


  server.listen(8080);

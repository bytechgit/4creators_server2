import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("dotenv").config();
import { createPool, PoolOptions, Pool, PoolConnection } from "mysql2/promise";
const readXlsxFile = require('read-excel-file/node');
const multer = require('multer');
//const fetch = require( "node-fetch");
//import * as fetch from 'node-fetch';

import express, { Request, Application, Response } from "express";
import fetch from "node-fetch";


class WebApp {
  private mySqlWeb: Pool;
  private snowioAccessToken: String = "";
  private uploadFile: any;
  constructor(private app: Application) {

 
      const pooloptions: PoolOptions = {
        host: process.env.MY_SQL_DB_HOST,
        user: process.env.MY_SQL_WEB_USER,
        password: process.env.MY_SQL_WEB_PASSWORD,
        database: process.env.MY_SQL_WEB_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      }
    this.mySqlWeb = createPool(pooloptions);


    const storage = multer.diskStorage({
      destination: (req:any, file:any, cb:any) => {
        cb(null,'./uploads/')
      },
      filename: (req:any, file:any, cb:any) => {
        cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname)
      },
    })
    this.uploadFile = multer({ storage: storage });

  

    // this.mySqlWeb.connect((err:any) => {
    //   if (err) throw err;
    //   console.log("Mysql web Connected!");
    // });
    console.log("Web App is running!");

    this.init();
    this.getSnowioAccessToken();
  }
  async getSnowioAccessToken()
  {
    const response = await fetch ('https://api.snov.io/v1/oauth/access_token', {
      method: 'post',
      body: JSON.stringify({
        'grant_type':'client_credentials',
        'client_id': process.env.SNOWIO_CLIENT_ID,
        'client_secret': process.env.SNOWIO_CLIENT_SECRET
      }),
      headers: {'Content-Type': 'application/json'}
    });
    const data:any = await response.json();
    this.snowioAccessToken = data.access_token;
    setTimeout(() => {
      this.getSnowioAccessToken();
    }, 3500000);
  }

  init() {
    const app = this.app;
    const mySqlWeb = this.mySqlWeb;
 
    // //////////////////////////////////////////////SERVICE FUNCTION///////////////////////////////////////////


//#region  Get Functions
    app.get("/getLocations", async (req: Request, res: Response): Promise<void> => {
  
      mySqlWeb.execute("SELECT * FROM `Locations`").then(([rows, fields]) =>{
         res.send(rows);
      }).catch(err=> {throw err;})

    });

    app.get("/getIndustries", async (req: Request, res: Response): Promise<void> => {
  
      mySqlWeb.execute("SELECT * FROM `Industries`").then(([rows, fields]) =>{
         res.send(rows);
      }).catch(err=> {throw err;})
    });

    app.get("/getUser", async (req: Request, res: Response): Promise<void> => {
      if (req.query.userid)
      {
        mySqlWeb.execute("SELECT * FROM `Users` WHERE id=?",[req.query.userid]).then(([result,fields]) =>{
         res.send(result);
      }).catch(err=> {throw err;});
      }
     else {
            res.status(399).send("[/getUser] Nisu unesena sva polja.");
          }
    });

    app.get("/getUserContactsLists", async (req: Request, res: Response): Promise<void> => {
      if (req.query.userid)
      {
        mySqlWeb.execute("SELECT UserContactLists.*, COUNT(ListJoinContacts.listid) as numberofcontacts FROM `UserContactLists` \
        left join ListJoinContacts\
        on UserContactLists.id = ListJoinContacts.listid\
        WHERE userid = ? GROUP by UserContactLists.id",[req.query.userid]).then(([result,fields]) =>{
         res.send(result);
      }).catch(err=> {throw err;});
      }
     else {
            res.status(399).send("[/getUserContactsLists] Nisu unesena sva polja.");
          }
    });


    // app.get("/getAllContactsLists", async (req: Request, res: Response): Promise<void> => {
    //   if (req.query.userid)
    //   {
    //     mySqlWeb.execute('SELECT ListJoinContacts.listid,Contacts.* FROM UserContactLists\
    //     INNER JOIN ListJoinContacts on UserContactLists.id = ListJoinContacts.listid\
    //     INNER JOIN Contacts on ListJoinContacts.contactid = Contacts.id\
    //     WHERE userid = ?',[req.query.userid]).then(([result, fields]) =>{
    //      res.send(result);
    //   }).catch(err=> {throw err;});
    //   }
    //  else {
    //         res.status(399).send("[/getContactListAll] Nisu unesena sva polja.");
    //       }
    // });


    app.get("/getContactsByListId1", async (req: Request, res: Response): Promise<void> => {
      if (req.query.listid)
      {
        mySqlWeb.execute('SELECT AllContactsInLists.contacttype, AllContactsInLists.id, AllContactsInLists.firstname, AllContactsInLists.lastname, AllContactsInLists.email, AllContactsInLists.companyname, AllContactsInLists.companysize, AllContactsInLists.jobtitle, Locations.name as location, Industries.name as industry FROM AllContactsInLists\
        LEFT JOIN Locations ON AllContactsInLists.locationid = Locations.id\
        LEFT JOIN Industries ON AllContactsInLists.industryid = Industries.id\
        where AllContactsInLists.listid = ?',[req.query.listid]).then(([result, fields]) =>{
         res.send(result);
      }).catch(err=> {throw err;});
      }
     else {
            res.status(399).send("[/getContactsByListId1] Nisu unesena sva polja.");
          }
    });

    app.get("/getContactsByListId", async (req: Request, res: Response): Promise<void> => {
      if (req.query.listid)
      {
        mySqlWeb.execute('SELECT Contacts.id, Contacts.firstname, Contacts.lastname, Contacts.email, Contacts.companyname, Contacts.companysize, Contacts.jobtitle,Locations.name as location, Industries.name as industry FROM ListJoinContacts\
        LEFT JOIN Contacts on ListJoinContacts.contactid = Contacts.id\
        LEFT JOIN Locations ON Contacts.locationid = Locations.id\
        LEFT JOIN Industries ON Contacts.industryid = Industries.id\
        where ListJoinContacts.listid = ?',[req.query.listid]).then(([result, fields]) =>{
         res.send(result);
      }).catch(err=> {throw err;});
      }
     else {
            res.status(399).send("[/getContactsByListId] Nisu unesena sva polja.");
          }
    });

    app.post("/getContactsByListIds1", async (req: Request, res: Response): Promise<void> => {
      if (req.body.listids )
      {
        mySqlWeb.execute('SELECT AllContactsInLists.contacttype, AllContactsInLists.id, AllContactsInLists.firstname, AllContactsInLists.lastname, AllContactsInLists.email, AllContactsInLists.companyname, AllContactsInLists.companysize, AllContactsInLists.jobtitle,Locations.name as location, Industries.name as industry,AllContactsInLists.listid FROM AllContactsInLists\
        LEFT JOIN Locations ON AllContactsInLists.locationid = Locations.id\
        LEFT JOIN Industries ON AllContactsInLists.industryid = Industries.id\
        where AllContactsInLists.listid IN ( '+(req.body.listids as Number[]).map(e=> "?").join(",")+')\
        ORDER by AllContactsInLists.listid',[...(req.body.listids as Number[])]).then(([result, fields]) =>{
         
          //let pomres: Map<Number,any[]> = new Map<Number, any[]>(); 
          console.log([(req.body.listids as Number[]).join(", ")]);
          let pomres: {[id:number]: any[]} = {};
          (result as []).forEach((e:any)=>
            {
              if(!pomres[e.listid])
              pomres[e.listid] =  [];
              pomres[e.listid].push(e);
            });

            console.log(pomres);
            res.send(pomres);

      }).catch(err=> {throw err;});
      }
     else {
            res.status(399).send("[/getContactsByListIds1] Nisu unesena sva polja.");
          }
    });

    app.post("/getContactsByListIds", async (req: Request, res: Response): Promise<void> => {
      if (req.body.listids )
      {
        mySqlWeb.execute('SELECT Contacts.id, Contacts.firstname, Contacts.lastname, Contacts.email, Contacts.companyname, Contacts.companysize, Contacts.jobtitle,Locations.name as location, Industries.name as industry,ListJoinContacts.listid FROM ListJoinContacts\
        LEFT JOIN Contacts on ListJoinContacts.contactid = Contacts.id\
        LEFT JOIN Locations ON Contacts.locationid = Locations.id\
        LEFT JOIN Industries ON Contacts.industryid = Industries.id\
        where ListJoinContacts.listid IN ( '+(req.body.listids as Number[]).map(e=> "?").join(",")+')\
        ORDER by listid',[...(req.body.listids as Number[])]).then(([result, fields]) =>{
         
          //let pomres: Map<Number,any[]> = new Map<Number, any[]>(); 
          console.log([(req.body.listids as Number[]).join(", ")]);
          let pomres: {[id:number]: any[]} = {};
          (result as []).forEach((e:any)=>
            {
              if(!pomres[e.listid])
              pomres[e.listid] =  [];
              pomres[e.listid].push(e);
            });

            console.log(pomres);
            res.send(pomres);

      }).catch(err=> {throw err;});
      }
     else {
            res.status(399).send("[/getContactsByListIds] Nisu unesena sva polja.");
          }
    });




    app.post("/getIndividualSearchResults", async (req: Request, res: Response): Promise<void> => {
      if (req.body.userid && req.body.limit!= null &&  req.body.offset != null && req.body.netnew != null &&  req.body.domainName != null )
      {
        let map: (string | Number)[] = [];
        let wheremap: (string | Number)[] = [];

      let wherequery: string = "";
      let query: string = "SELECT  AllContacts.*, Locations.name as location, Industries.name as industry,\
      (AllContacts.email IN (SELECT DISTINCT AllContactsInLists.email FROM Users INNER JOIN UserContactLists ON Users.id = UserContactLists.userid\
        INNER JOIN AllContactsInLists on UserContactLists.id = AllContactsInLists.listid\
        WHERE Users.id = ?)) as saved\
        FROM AllContacts\
        LEFT  JOIN Locations on AllContacts.locationid = Locations.id\
        LEFT  JOIN Industries on AllContacts.industryid = Industries.id";
      map.push(req.body.userid);

      wherequery = " WHERE email LIKE ? OR weblink LIKE ? AND ";
      wheremap.push("%"+req.body.domainName+"%");
      wheremap.push("%"+req.body.domainName+"%");

      if (req.body.netnew == 1) {
        wherequery+=" AllContacts.id NOT IN \
                (SELECT DISTINCT AllContactsInLists.email FROM Users INNER JOIN UserContactLists ON Users.id = UserContactLists.userid\
                INNER JOIN AllContactsInLists on UserContactLists.id = AllContactsInLists.listid\
                WHERE Users.id = ?) AND ";
              wheremap.push(req.body.userid);
      }
      wherequery += " 1 ";

      query += wherequery;
      map = [...map, ...wheremap];

     query = query.concat(" ORDER BY ");
     if(req.body.sortsize != null)
     {
      query = query.concat(" AllContacts.companysize ");
      query = query.concat(req.body.sortsize == true? " ASC, ":" DESC, ");
     }
     if(req.body.sortcompany != null)
     {
      query = query.concat(" AllContacts.companyname ");
      query = query.concat(req.body.sortcompany == true? " ASC, ":" DESC, ");
     }
     if(req.body.sortcontact != null)
     {
      query = query.concat(" AllContacts.firstname ");
      query = query.concat(req.body.sortcontact == true? " ASC, ":" DESC, ");
     }
      query = query.concat(" AllContacts.id DESC LIMIT ? OFFSET ? ");

      map.push(req.body.limit);
      map.push(req.body.offset);

     console.log(query);
     console.log(map);
     mySqlWeb.execute(query,[...map]).then(([result, fields]) =>{
      if((result as []).length > 0)
      {
        res.send({contacts:result});
      }
      else
      {
        //api
      }
    
     }).catch(err=> {throw err;});
      }
     else {
            res.status(399).send("[/getIndividualSearchResults] Nisu unesena sva polja.");
          }
    });

    app.post("/getSearchResults2", async (req: Request, res: Response): Promise<void> => {
      if (req.body.userid && req.body.limit!= null &&  req.body.offset != null && req.body.netnew != null )
      {
      
        let map:String | Number[] = [];
        let wherequery: string = " WHERE ";
        let query: string = "SELECT  Contacts.*, Locations.name as location, Industries.name as industry,\
        (Contacts.email IN (SELECT DISTINCT AllContactsInLists.email FROM Users INNER JOIN UserContactLists ON Users.id = UserContactLists.userid\
          INNER JOIN AllContactsInLists on UserContactLists.id = AllContactsInLists.listid\
          WHERE Users.id = ?)) as saved, \
        0+";

      if(req.body.companyName != null)
      {
        query +="MATCH(companyname) AGAINST (? IN BOOLEAN MODE) + ";
        wherequery += "MATCH(companyname) AGAINST (? IN BOOLEAN MODE) AND ";
        map.push(req.body.companyName);
      }
      if(req.body.domainName != null)
      {
        query +="MATCH(email,weblink) AGAINST (? IN BOOLEAN MODE) + ";
        wherequery += "MATCH(email,weblink) AGAINST (? IN BOOLEAN MODE) AND ";
        map.push(req.body.domainName);
      }
      if(req.body.keywords != null)
      {
        query +="MATCH(keywords) AGAINST (? IN BOOLEAN MODE) + ";
        wherequery += "MATCH(keywords) AGAINST (? IN BOOLEAN MODE) AND ";
        map.push(req.body.keywords);
      }
      if(req.body.jobTitle != null)
      {
        query +="MATCH(jobtitle) AGAINST (? IN BOOLEAN MODE) + ";
        wherequery += "MATCH(jobtitle) AGAINST (? IN BOOLEAN MODE) AND ";
        map.push(req.body.jobTitle);
      }

      const duplicatemap = [req.body.userid, ...map, ...map];

      if(req.body.locations && (req.body.locations as Number[]).length >0 )
      {
        duplicatemap.push(...(req.body.locations as Number[]));
        wherequery+="Contacts.locationid IN ("+ (req.body.locations as Number[]).map(e=> "?").join(",") +") AND ";
      }
      if(req.body.industries  && (req.body.industries as Number[]).length >0 )
      {
        duplicatemap.push(...(req.body.industries as Number[]));
        wherequery+= "Contacts.industryid IN ("+(req.body.industries as Number[]).map(e=> "?").join(",") + ") AND ";
      }

      if (req.body.netnew == 1) {
              wherequery+=" Contacts.id NOT IN \
                (SELECT DISTINCT AllContactsInLists.email FROM Users INNER JOIN UserContactLists ON Users.id = UserContactLists.userid\
                INNER JOIN AllContactsInLists on UserContactLists.id = AllContactsInLists.listid\
                WHERE Users.id = ?) AND ";
              duplicatemap.push(req.body.userid);
      }
      
      wherequery += " 1 ";

      query+=" 0 as relevant\
      FROM    Contacts\
      INNER  JOIN Locations on Contacts.locationid = Locations.id\
      LEFT  JOIN Industries on Contacts.industryid = Industries.id";
      
      query+= wherequery;

     query = query.concat("ORDER BY ");
     if(req.body.sortsize != null)
     {
      query = query.concat(" Contacts.companysize ");
      query = query.concat(req.body.sortsize == true? " ASC, ":" DESC, ");
     }
     if(req.body.sortcompany != null)
     {
      query = query.concat(" Contacts.companyname ");
      query = query.concat(req.body.sortcompany == true? " ASC, ":" DESC, ");
     }
     if(req.body.sortcontact != null)
     {
      query = query.concat(" Contacts.firstname ");
      query = query.concat(req.body.sortcontact == true? " ASC, ":" DESC, ");
     }
      query = query.concat(" relevant, Contacts.id DESC LIMIT ? OFFSET ? ");
      
      duplicatemap.push(req.body.limit);
      duplicatemap.push(req.body.offset);

      mySqlWeb.execute(query,duplicatemap).then(([result,fields]) =>{
          res.send({contacts:result});
     
      }).catch(err=> {throw err;});
       
      }
     else {
            res.status(399).send("[/getSearchResults2] Nisu unesena sva polja.");
          }
    });


    app.post("/getSearchResults1", async (req: Request, res: Response): Promise<void> => {
      if (req.body.userid && req.body.limit!= null &&  req.body.offset != null && req.body.netnew != null )
      {
      
        let map:String | Number[] = [];
       // let dmap:String | Number[] = [];

        console.log(map);
      let wherequery: string = "";
      let query: string = "SELECT  Contacts.*, Locations.name as location, Industries.name as industry,\
      (Contacts.id IN (SELECT DISTINCT ListJoinContacts.contactid FROM Users INNER JOIN UserContactLists ON Users.id = UserContactLists.userid\
        INNER JOIN ListJoinContacts on UserContactLists.id = ListJoinContacts.listid\
        WHERE Users.id = ?)) as saved, \
       0+";
       //map.push(req.body.userid);

      if(req.body.companyName != null)
      {
        query +="MATCH(companyname) AGAINST (? IN BOOLEAN MODE) + ";
        wherequery += "MATCH(companyname) AGAINST (? IN BOOLEAN MODE) AND ";
        map.push(req.body.companyName);
      }
      if(req.body.domainName != null)
      {
        query +="MATCH(email,weblink) AGAINST (? IN BOOLEAN MODE) + ";
        wherequery += "MATCH(email,weblink) AGAINST (? IN BOOLEAN MODE) AND ";
        map.push(req.body.domainName);
      }
      if(req.body.keywords != null)
      {
        query +="MATCH(keywords) AGAINST (? IN BOOLEAN MODE) + ";
        wherequery += "MATCH(keywords) AGAINST (? IN BOOLEAN MODE) AND ";
        map.push(req.body.keywords);
      }
      if(req.body.jobTitle != null)
      {
        query +="MATCH(jobtitle) AGAINST (? IN BOOLEAN MODE) + ";
        wherequery += "MATCH(jobtitle) AGAINST (? IN BOOLEAN MODE) AND ";
        map.push(req.body.jobTitle);
      }
      const duplicatemap = [req.body.userid, ...map, ...map];

      if(req.body.locations && (req.body.locations as Number[]).length >0 )
      {
        duplicatemap.push(...(req.body.locations as Number[]));
        map.push(...(req.body.locations as Number[]));
        wherequery+="Contacts.locationid IN ("+ (req.body.locations as Number[]).map(e=> "?").join(",") +") AND ";
      }
      if(req.body.industries  && (req.body.industries as Number[]).length >0 )
      {
        duplicatemap.push(...(req.body.industries as Number[]));
        map.push(...(req.body.industries as Number[]));
        wherequery+= "Contacts.industryid IN ("+(req.body.industries as Number[]).map(e=> "?").join(",") + ") AND ";
      }

      if (req.body.netnew == 1) {
              wherequery+=" Contacts.id NOT IN \
              (SELECT DISTINCT ListJoinContacts.contactid FROM Users INNER JOIN UserContactLists ON Users.id = UserContactLists.userid\
              INNER JOIN ListJoinContacts on UserContactLists.id = ListJoinContacts.listid\
              WHERE Users.id = ?) AND ";

              duplicatemap.push(req.body.userid);
              map.push(req.body.userid);
      }


      query+=" 0 as relevant\
      FROM    Contacts\
      INNER  JOIN Locations on Contacts.locationid = Locations.id\
      LEFT  JOIN Industries on Contacts.industryid = Industries.id\
      WHERE ";
      query+= wherequery;
      // dupliciranje
      query += " 1 ";
     // if(&& req.body.sortsize && req.body.sortcontact && req.body.sortcompany)
     query = query.concat("ORDER BY ");
     if(req.body.sortsize != null)
     {
      query = query.concat(" Contacts.companysize ");
      query = query.concat(req.body.sortsize == true? " ASC, ":" DESC, ");
     }
     if(req.body.sortcompany != null)
     {
      query = query.concat(" Contacts.companyname ");
      query = query.concat(req.body.sortcompany == true? " ASC, ":" DESC, ");
     }
     if(req.body.sortcontact != null)
     {
      query = query.concat(" Contacts.firstname ");
      query = query.concat(req.body.sortcontact == true? " ASC, ":" DESC, ");
     }
      query = query.concat(" relevant, Contacts.id DESC LIMIT ? OFFSET ? ");
   //  query += "relevant,Contacts.id DESC LIMIT ? OFFSET ? ";

    //  query = query.concat("ORDER BY relevant,Contacts.id DESC LIMIT ? OFFSET ? ");

      
      duplicatemap.push(req.body.limit);
      duplicatemap.push(req.body.offset);
        console.log(query);
        console.log(duplicatemap);
        console.log(map);
     




        

      if(req.body.offset == 0)
      {
       mySqlWeb.execute("SELECT COUNT(*) as numberofrows From Contacts WHERE "+wherequery+ " 1 " ,[...map]).then(([topresult, fields]:any) =>{
          mySqlWeb.execute(query,duplicatemap).then(([result, fields]) =>{
            //console.log(result);
         //   res.send(({...result,numberofrows:topresult[0].numberofrows}));
         res.send({contacts: result, numberofrows:topresult[0].numberofrows})
         }).catch(err=> {throw err;});
       }).catch(err=> {throw err;});
      }
      else
      {
        mySqlWeb.execute(query,duplicatemap).then(([result,fields]) =>{

          res.send({contacts:result});
       }).catch(err=> {throw err;});
      }

       
      }
     else {
            res.status(399).send("[/getSearchResults] Nisu unesena sva polja.");
          }
    });


    app.post("/getSearchResults", async (req: Request, res: Response): Promise<void> => {
      console.log(req.body);
      if (req.body.keywords!= null && req.body.limit != null && req.body.offset!= null)
      {
        const map = [req.body.keywords as string,req.body.keywords as string];
      
        console.log(map);
      let query: string = "SELECT  Contacts.*, Locations.name as location, Industries.name as industry, \
      MATCH(companyname, weblink, jobtitle, keywords, seodescription) AGAINST (? IN BOOLEAN MODE) as relevant\
      FROM    Contacts\
      LEFT  JOIN Locations on Contacts.locationid = Locations.id\
      LEFT  JOIN Industries on Contacts.industryid = Industries.id\
      WHERE MATCH(companyname, weblink, jobtitle, keywords, seodescription) AGAINST (? IN BOOLEAN MODE)";

      if(req.body.locations  && (req.body.locations as Number[]).length >0 )
      {
       // map.push((req.body.locations as string[]).map(e=> '"'+e+'"').join(" "));
        //query = query.concat("AND MATCH(Locations.name) AGAINST (? IN BOOLEAN MODE)")
        map.push((req.body.locations as Number[]).map(e=> " "+e).join(","));
        query = query.concat("AND Contacts.locationid IN (?) ");
      }
      if(req.body.industries  && (req.body.industries as Number[]).length >0 )
      {
        //map.push(req.body.industries);
        //query = query.concat("AND MATCH(Industries.name) AGAINST (? IN BOOLEAN MODE)");
        map.push((req.body.industries as Number[]).map(e=> " "+e).join(","));
        query = query.concat("AND Contacts.industryid IN (?) ");
      }
   
      query = query.concat("ORDER BY relevant, Contacts.id DESC LIMIT ? OFFSET ? ");
      map.push(req.body.limit);
      map.push(req.body.offset);

      console.log(query);

        mySqlWeb.execute(query,map).then(([result, fields]) =>{
         res.send(result);
      }).catch(err=> {throw err;});
      }
     else {
            res.status(399).send("[/getSearchResults] Nisu unesena sva polja.");
          }
    });

    app.post("/getSnowioEmail", async (req: Request, res: Response): Promise<void> => {
      if (req.body.domain && req.body.limit != null && req.body.offset != null)
      {
        const response = await fetch(`https://api.snov.io/v2/domain-emails-with-info?access_token=${this.snowioAccessToken}&domain=${req.body.domain}&type=all&limit=${req.body.limit}&lastId=${req.body.offset}`, {
        method: 'get'
      });
      const data:any = await response.json();
      res.send(data.emails);
      }
     else {
            res.status(399).send("[/getSnowioEmail] Nisu unesena sva polja.");
          }
    });
    


    //#endregion

//#region  Create Functions

    app.post("/createAndGetUser",
    async (req: Request, res: Response): Promise<void> => {
      if (
        req.body.userid &&
        req.body.name &&
        req.body.image
      ) {
       let conn:PoolConnection | null = null;
        try {
            conn = await mySqlWeb.getConnection();
            await conn.beginTransaction();
            let user = null;
            const [result1, fields1]: any = await conn.execute('SELECT * FROM `Users` WHERE `id` = ?',[req.body.userid]);
            console.log(result1.length);
            if(result1.length > 0)
            {
              user = result1[0];
            }
            else
            {
              await conn.execute('INSERT INTO `Users`(`id`, `name`, `image`, `tokens`,`uncategorizedlistid`) VALUES (?,?,?,?,?)',[ req.body.userid, req.body.name, req.body.image, 100,0]);
              await conn.execute('INSERT INTO `UserContactLists`(`userid`, `listname`, `lastmodified`) VALUES (?,?,?)',[ req.body.userid, "Uncategorized Contacts", Date()]);
              const [result, fields]: any = await conn.execute('SELECT LAST_INSERT_ID() as listid',[]);
              await conn.execute('UPDATE `Users` SET `uncategorizedlistid`= ? WHERE `id` = ?',[result[0].listid, req.body.userid]);
              user = {
                id:req.body.userid,
                name: req.body.name,
                image: req.body.image,
                tokens:100,
                uncategorizedlistid: result[0].listid
              }
            }
            await conn.commit();
            res.send(user);
        } catch (error) {
            if (conn) await conn.rollback();
            throw error;
        }
        finally{
            if (conn) await conn.release();
        }
      
      } else {
        res.status(399).send("[/createAndGetUser] Nisu unesena sva polja.");
      }
    }
    );

    app.post("/createUserContactsList",
      async (req: Request, res: Response): Promise<void> => {
        if (
          req.body.userid &&
          req.body.listname &&
          req.body.contacttypes && 
          req.body.lastmodified
        ) {
          let conn:PoolConnection | null = null;
          try {
            conn = await mySqlWeb.getConnection();
            await conn.beginTransaction();
            await conn.execute('INSERT INTO `UserContactLists`( `userid`, `listname`, `lastmodified`) VALUES (?,?, ?)',[ req.body.userid, req.body.listname, req.body.lastmodified]);
            const [result, fields]: any = await conn.execute('SELECT LAST_INSERT_ID() as listid',[]);
            //console.log(result[0]);
            if(req.body.contactids)
            {
              const contacttypeslist: [] = req.body.contacttypes as [];
              let query:string = "INSERT INTO `ListJoinContacts`(`listid`, `contactid`) VALUES "+ (req.body.contactids as Number[]).map(e=>"(?,?)").join(",");
              const params:(Number | null)[][] = (req.body.contactids as Number[]).map((id,index)=> {
                return [req.body.listid as Number, contacttypeslist[index] == 0? id: null, contacttypeslist[index] == 0? null: id];
              })
             // console.log(params.flat(1));
             await conn.execute(query,params.flat(1));
            }
            if(req.body.tokens != null)
            {
              await conn.execute("UPDATE `Users` SET  tokens = tokens - ? where id = ?",[req.body.tokens, req.body.userid]);
            }
            await conn.commit();
            res.json({id:result[0].listid});
          } catch (error) {
            if (conn) await conn.rollback();
            throw error;
          }
          finally{
              if (conn) await conn.release();
          }
        } else {
          res.status(399).send("[/createUserContactsList] Nisu unesena sva polja.");
        }
      }
    );

    app.post("/addContactsToUserContactsList",
      async (req: Request, res: Response): Promise<void> => {
        if (
          req.body.userid != null &&
          req.body.listid != null &&
          req.body.contactids &&
          req.body.contacttypes && 
          req.body.lastmodified
        ) {
          const contacttypeslist: [] = req.body.contacttypes as [];
          let query:string = "INSERT INTO `ListJoinContacts`(`listid`, `contactid`, `apicontactid`) VALUES " + (req.body.contactids as Number[]).map(e=>"(?,?,?)").join(",");
          const params:(Number | null)[][] = (req.body.contactids as Number[]).map((id,index)=> {
            return [req.body.listid as Number, contacttypeslist[index] == 0? id: null, contacttypeslist[index] == 0? null: id];
          })

          let conn:PoolConnection | null = null;
          try {
              conn = await mySqlWeb.getConnection();
              await conn.beginTransaction();
              await conn.execute(query,params.flat(1));
              await conn.execute("UPDATE `UserContactLists` SET `lastmodified`= ? WHERE id = ?", [req.body.lastmodified, req.body.listid]);
              if(req.body.tokens != null)
              {
                await conn.execute("UPDATE `Users` SET  tokens = tokens - ? where id = ?",[req.body.tokens, req.body.userid]);
              }
              await conn.commit();
              res.send("Uspesno dodati kontakti u listu."+req.body.lastmodified);

          } catch (error) {
            if (conn) await conn.rollback();
            throw error;
          }
          finally{
              if (conn) await conn.release();
          }
         
        } else {
          res.status(399).send("[/addContactsToUserContactList] Nisu unesena sva polja.");
        }
      }
    );
    app.post('/import-excel', this.uploadFile.single('import-excel'), async (req:any, res:Response) => {
      try {
        await importFileToDb( './uploads/' + req.file.filename)
        res.send("Uspesno dodato.");
      } catch (error) {
        console.log(error);
        throw new Error("Greska");
      }
   
    //  console.log(res);
    })

    async function importFileToDb(exFile:any) {
        let rows:any = await readXlsxFile(exFile);
        rows.shift();
       // console.log(rows);
        rows = (rows as []);
        const nrows = (rows as []).map(row => [row[0],row[1], row[4], row[3],row[2], row[5], getRandomInt(1,8), getRandomInt(1,11), row[14], row[15], row[10], row[9], row[12], null, row[11], row[8]]);
        console.log(nrows);
        await mySqlWeb.execute("REPLACE INTO `Contacts`( `firstname`, `lastname`, `email`, `companyname`, `jobtitle`, `companysize`, `locationid`, `industryid`, `seodescription`, `keywords`, `inlink`, `weblink`, `twitterlink`, `instalink`, `fblink`, `personalinlink`) VALUES  " + (nrows).map((m) => "(" +m.map(e=> "?").join(",") +") ").join(", "), nrows.flat(1));
      
    }
    function getRandomInt(min:number, max:number) {
      return Math.floor(min+ Math.random() * (max-min));
    }
    

//#endregion

//#region Update Functions
app.put("/updateUserTokens",
    async (req: Request, res: Response): Promise<void> => {
      if (
        req.body.userid &&
        req.body.tokens
      ) {
        mySqlWeb.execute('UPDATE `Users` SET `tokens`= ? WHERE Users.id = ?',[req.body.tokens, req.body.userid]).then(([result, fields]) =>{
        res.send(result);
        }).catch(err=> {throw err;});
      } else {
        res.status(399).send("[/updateUserTokens] Nisu unesena sva polja.");
      }
    }
    );

    app.put("/updateContactsListName",
    async (req: Request, res: Response): Promise<void> => {
      if (
        req.body.listid &&
        req.body.newname
      ) {
        mySqlWeb.execute('UPDATE `UserContactLists` SET `listname`= ? WHERE id = ?',[req.body.newname, req.body.listid]).then(([result, fields]) =>{
        res.send(result);
        }).catch(err=> {throw err;});
      } else {
        res.status(399).send("[/updateContactsListName] Nisu unesena sva polja.");
      }
    }
    );
//#endregion

//#region Remove Functions
    app.delete("/removeContactsFromUserContactsList",
      async (req: Request, res: Response): Promise<void> => {
        if (
          req.body.listid &&
          req.body.contactids
        ) {
          const instr:string = (req.body.contactids as Number[]).map(el=> "?").join(", ");

          let query:string = "DELETE FROM `ListJoinContacts` WHERE `listid` = ? AND (`contactid` IN ("+instr+") OR `apicontactid` IN ("+instr+"))";
          
          mySqlWeb.execute(query, [req.body.listid, ...(req.body.contactids as Number[])]).then(([result, fields]) =>{
           res.send(result);
          }).catch(err=> {throw err;});
        } else {
          res.status(399).send("[/removeContactsFromUserContactsList] Nisu unesena sva polja.");
        }
      }
    );

    app.delete("/removeUserContactsList",
      async (req: Request, res: Response): Promise<void> => {
        if (
          req.query.listid
        ) {
          mySqlWeb.execute('DELETE FROM `UserContactLists` WHERE `id` = ? ', [req.query.listid]).then(([result,fields]) =>{
           res.send(result);
          }).catch(err=> {throw err;});
        } else {
          res.status(399).send("[/removeUserContactsList] Nisu unesena sva polja.");
        }
      }
    );
//#endregion    











    // app.post(
    //   "/insertUser",
    //   async (req: Request, res: Response): Promise<void> => {
    //     if (
    //       req.body.uid &&
    //       req.body.firstname &&
    //       req.body.lastname &&
    //       req.body.image &&
    //       req.body.password &&
    //       req.body.permission
    //     ) {
    //       var sql = `INSERT INTO Users (uid, firstname, lastname, password, image, permission) VALUES ('${req.body.uid}', '${req.body.firstname}', '${req.body.lastname}', '${req.body.password}', '${req.body.image}', '${req.body.permission}')`;
    //       mySqlWeb.query(sql, (err : any, result: any) => {
    //         if (err) {
    //           throw err;
    //         }
    //         console.log("1 record inserted in Users table.");
    //         res.send("1 record inserted in Users table.");
    //       });
    //     } else {
    //       res.status(399).send("[/insertUser] Nisu unesena sva polja.");
    //     }
    //   }
    // );


  }
}

export class IWebApp {
  static instance: WebApp | null = null;

  constructor() {
    throw new Error("Use Singleton.getInstance()");
  }
  static getInstance() {
    if (!IWebApp.instance)
      console.error("Web App nije inicijalizovan, pozovite funkciju init().");

    return IWebApp.instance;
  }
  static init(app: Application) {
    if (!IWebApp.instance) {
      IWebApp.instance = new WebApp(app);
    }
  }
}

export function getWebApp() {
  return IWebApp.getInstance();
}

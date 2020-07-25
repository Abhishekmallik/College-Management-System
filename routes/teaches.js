const express = require('express');
const router = express.Router();
const db = require('../db/database').getDatabase();
const tables = require('../db/tables');
const { validateTeaches } = require('../db/models');

router.get("/", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.teaches}`;
    db.all(sqlQuery, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/teaches.ejs", { teaches: rows });
    });
});

router.get("/create", function (req, res) {
    res.render("../FrontEnd/createTeaches.ejs");
});

router.post("/", (req, res) => {
    const { error } = validateTeaches(req.body);
    if (error) {
        return res.status(400).send({
            message: error.details[0].message
        });
    }

    const sec_id = req.body.section_id;
    const inst_id = req.body.instructor_id;

        const sqlQuery = `
        INSERT INTO ${tables.tableNames.teaches}
        (instructor_id, section_id)
        VALUES ('${inst_id}', '${sec_id}')`;

        const sqlQuery1 = `SELECT * FROM ${tables.tableNames.section} WHERE ${tables.sectionColumns.id} = ?`;
        const sqlQuery2 = `SELECT * FROM ${tables.tableNames.instructor} WHERE ${tables.instructorColumns.id} = ?`;
        db.get(sqlQuery1, [sec_id], (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "An error occurred"
                });
            }
            if (!rows) {
                return res.status(404).send({
                    message: "A section with the requested id was not found. Sorry! " + sec_id
                });
            }
            db.get(sqlQuery2, [inst_id], (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "An error occurred"
                });
            }
            if (!rows) {
                return res.status(404).send({
                    message: "An instructor with the requested ID was not found." + inst_id
                });
            }
            db.run(sqlQuery, (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "An error occured while trying to save the student details"
                });
            }
            res.redirect("/teaches");
        });
    
        });
        });
    
});

router.get("/:inst/instructor",(req,res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.instructor} WHERE ${tables.instructorColumns.id} = ?`;
    db.get(sqlQuery, [req.params.inst], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "An instructor with the requested ID was not found." + req.query.inst_id
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/instructorByID.ejs", { instructor: rows });
    });
});

router.get("/:sec/section", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.section} WHERE ${tables.sectionColumns.id} = ?`;
    db.get(sqlQuery, [req.params.sec], (err, rows) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred."
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "A section with the requested ID could not be found."
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/sectionById.ejs", { section: rows });
    });
})

router.get("/searchInst", (req, res) => {
	sec = req.query.section_id
    const sqlQuery = `
    SELECT instructor.id,instructor.name,instructor.salary,instructor.department_name
    FROM instructor
    JOIN teaches ON ${tables.teachesColumns.instructor_id} = ${tables.instructorColumns.id}
    WHERE teaches.section_id = '${sec}'`
    db.all(sqlQuery, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred" + req.query.section_id
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "A section with the requested ID was not found." + req.query.section_id
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/instructors.ejs", { instructor: rows });
    });
});

router.get("/searchSec", (req, res) => {
    inst = req.query.instructor_id
    const sqlQuery = `
    SELECT section.id,section.semester,section.year
    FROM ${tables.tableNames.section}
    JOIN ${tables.tableNames.teaches} ON ${tables.teachesColumns.section_id} = ${tables.sectionColumns.id}
    WHERE teaches.instructor_id = '${inst}'`
    db.all(sqlQuery, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred" + req.query.instructor_id
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "An instructor with the requested ID was not found." + req.query.instructor_id
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/sections.ejs", { sections: rows });
    });
});

router.post("/:inst/:sec/delete", (req, res) => {
	const inst = req.params.inst
	const sec = req.params.sec

    const sqlQuery = `
    DELETE FROM ${tables.tableNames.teaches}
    WHERE ${tables.teachesColumns.instructor_id} == ${inst} and ${tables.teachesColumns.section_id} == ${sec}`

    db.run(sqlQuery, (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to delete this tuple."
            });
        }
        return res.redirect("/teaches");
    });
});

router.get("/:inst/:sec/update",(req,res) => {
    console.log("UPDATE");
    const inst = req.params.inst
    const sqlQuery = `SELECT * FROM ${tables.tableNames.teaches} 
    WHERE ${tables.teachesColumns.instructor_id} = ${inst} and ${tables.teachesColumns.section_id} = ?`;
    db.get(sqlQuery, [req.params.sec], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "An tuple with the requested id was not found. Sorry! " + req.params.sec+" "+inst
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/teachesupdate.ejs", { teaches: rows });
    });
})

router.get("/:inst/:sec/updating",(req,res) => {
    const inst = req.query.newInst;
    const sec = req.query.newSec;
    const oinst = req.params.inst;
    const osec = req.params.sec;

    const sqlQuery = `
    UPDATE ${tables.tableNames.teaches} 
    SET instructor_id = '${inst}', section_id = '${sec}'
    WHERE ${tables.teachesColumns.instructor_id} = '${oinst}' and ${tables.teachesColumns.section_id} = '${osec}'`

        const sqlQuery1 = `SELECT * FROM ${tables.tableNames.section} WHERE ${tables.sectionColumns.id} = ?`;
        const sqlQuery2 = `SELECT * FROM ${tables.tableNames.instructor} WHERE ${tables.instructorColumns.id} = ?`;
        db.get(sqlQuery1, [sec], (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "An error occurred"
                });
            }
            if (!rows) {
                return res.status(404).send({
                    message: "A section with the requested id was not found. Sorry! " + sec
                });
            }
                db.get(sqlQuery2, [inst], (err, rows) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send({
                                message: "An error occurred"
                            });
                        }
                        if (!rows) {
                            return res.status(404).send({
                                message: "An instructor with the requested ID was not found." + inst
                            });
                        }
                        db.run(sqlQuery,(err) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send({
                                message: "An error occured while trying to update the student details"
                            });
                        }
                        console.log("1")
                        res.redirect("/teaches");
                    });
                
                    });
        
        });

})

module.exports = router;
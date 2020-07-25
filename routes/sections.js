const router = require('express').Router();
const tables = require('../db/tables');
const db = require('../db/database').getDatabase();
const { validateSection } = require('../db/models');

router.get("/", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.section}`;
    db.all(sqlQuery, (err, rows) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred."
            })
        }
        // res.send(rows);
        res.render("../FrontEnd/sections.ejs", { sections: rows });
    });
});

router.get("/create", function (req, res) {
    res.render("../FrontEnd/createSection.ejs")
});

router.post("/", (req, res) => {
    const { error } = validateSection(req.body);
    if (error) {
        return res.status(400).send({
            message: error.details[0].message
        });
    }

    const Id = req.body.id;
    const Sem = req.body.semester;
    const Yr = req.body.year;
    const sqlQuery = `
    INSERT INTO ${tables.tableNames.section}
    (id, semester, year)
    VALUES (${Id}, ${Sem}, ${Yr})`;

    db.run(sqlQuery, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occured while trying to save the section details"
            });
        }
        res.redirect("/sections")
    });
});

router.get("/search", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.section} WHERE ${tables.sectionColumns.id} = ?`;
    db.get(sqlQuery, [req.query.section_id], (err, rows) => {
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
});

router.get("/:id/instructors", (req, res) => {

    const sqlQuery = `
    SELECT * FROM ${tables.tableNames.instructor} 
    WHERE ${tables.instructorColumns.id} IN
        (SELECT ${tables.teachesColumns.instructor_id} 
        FROM ${tables.tableNames.teaches} 
        WHERE ${tables.teachesColumns.section_id} = $sectionId
        );
    `
    db.all(sqlQuery, { $sectionId: req.params.id }, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({ message: "An error occurred." });
        }

        if (!rows) {
            return res.status(404).send({
                message: "Instructors of the section with the given ID could not be found."
            });
        }

        // res.send(rows);
        res.render("../FrontEnd/sectionInstructors.ejs", { instructors: rows });
    })
});

router.post("/:id/delete", (req, res) => {
    const sqlQuery = `
    DELETE FROM ${tables.tableNames.section}
    WHERE ${tables.sectionColumns.id} = ?`;

    db.run(sqlQuery, [req.params.id], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred while trying to delete this section."
            });
        }
    const sqlQuery1 = `DELETE FROM ${tables.tableNames.teaches}
    WHERE ${tables.teachesColumns.section_id} == ${req.params.id}`

    db.run(sqlQuery1, (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to delete this tuple."
            });
        }
    });
        res.redirect("/sections");
    });
});

router.get("/:id/update",(req,res) => {
    console.log("UPDATE");
    const sqlQuery = `SELECT * FROM ${tables.tableNames.section} WHERE ${tables.sectionColumns.id} = ?`;
    db.get(sqlQuery, [req.params.id], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "A Section with the requested id was not found. Sorry! " + req.params.id
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/sectionupdate.ejs", { section: rows });
    });
})

router.get("/:id/updating",(req,res) => {
    const id = req.query.newid;
    const semester = req.query.newSem;
    const year = req.query.newYear;

    const sqlQuery = `
    UPDATE ${tables.tableNames.section} 
    SET id = '${id}', semester= '${semester}', year= '${year}'
    WHERE ${tables.sectionColumns.id} = ?`

    db.run(sqlQuery, [req.params.id], (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to update this section "+req.params.id
            });
        }
    })

    const sqlQuery1 = `
    UPDATE ${tables.tableNames.teaches} 
    SET section_id = '${id}'
    WHERE ${tables.teachesColumns.section_id} = ?;`

    db.run(sqlQuery1, [req.params.id], (err) => {
        if (err) {
            return res.status(500).send({
                message: "1.An error occurred while trying to update this section."
            });
        }
        res.redirect("/sections")
    })

})

module.exports = router;
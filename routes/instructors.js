const router = require('express').Router();
const tables = require('../db/tables');
const db = require('../db/database').getDatabase();
const { validateInstructor } = require('../db/models');

router.get("/", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.instructor}`
    db.all(sqlQuery, (err, rows) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred."
            })
        }
        res.render("../FrontEnd/instructors.ejs", { instructor: rows });
    });
});


router.get("/create", (req, res) => {
    res.render('../FrontEnd/createInstructor.ejs');
});

router.post("/", (req, res) => {
    const { error } = validateInstructor(req.body);
    if (error) {
        return res.status(400).send({
            message: error.details[0].message
        });
    }

    const iname = req.body.name;
    const idept = req.body.department_name;
    const isalary = req.body.salary;
    const sqlQuery = `
    INSERT INTO ${tables.tableNames.instructor}
    (name, salary, department_name)
    VALUES ('${iname}', ${isalary}, '${idept}')`;

    const sqlQuery1 = `SELECT * FROM ${tables.tableNames.department} WHERE ${tables.deptColumns.deptName} = ? COLLATE NOCASE`;
    db.get(sqlQuery1, [idept], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "A department with the requested name was not found. Sorry! " + idept
            });
        }
        db.run(sqlQuery, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occured while trying to save the instructor details"
            });
        }
        res.redirect("/instructors");
    });
    });

    
});

router.get("/search", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.instructor} WHERE ${tables.instructorColumns.id} = ?`;
    db.get(sqlQuery, [req.query.inst_id], (err, rows) => {
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

router.get("/:name/department", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.department} WHERE ${tables.deptColumns.deptName} = ? COLLATE NOCASE`;
    db.get(sqlQuery, [req.params.name], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "A department with the requested name was not found. Sorry! " + req.query.Dept_name
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/departmentByName.ejs", { department: rows });
    });
})

router.post("/:id/delete", (req, res) => {
    
    const inst_id = ''
    const sqlQuery = `
        UPDATE ${tables.tableNames.student} 
        SET ${tables.studentColumns.instructor_id} = '${inst_id}'
        WHERE ${tables.studentColumns.instructor_id} = ?`

    db.run(sqlQuery, [req.params.id], (err) => {
        if (err) {
            return res.status(500).send({
                message: "1.An error occurred while trying to delete this instructor for a student"
            });
        }
    })
    const sqlQuery2 = `DELETE FROM ${tables.tableNames.teaches}
    WHERE ${tables.teachesColumns.instructor_id} == ${req.params.id}`

    db.run(sqlQuery2, (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to delete this tuple."
            });
        }
    });

    const sqlQuery1 =
    `DELETE FROM ${tables.tableNames.instructor}
    WHERE ${tables.instructorColumns.id} = ?`;
    db.run(sqlQuery1, [req.params.id], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred while trying to delete the instructor"
            });
        }
        res.redirect("/instructors");
    });
})

router.get("/:id/update",(req,res) => {
    console.log("UPDATE");
    const sqlQuery = `SELECT * FROM ${tables.tableNames.instructor} WHERE ${tables.instructorColumns.id} = ?`;
    db.get(sqlQuery, [req.params.id], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "An Instructor with the requested id was not found. Sorry! " + req.params.id
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/instructorupdate.ejs", { instructor: rows });
    });
})

router.get("/:id/updating",(req,res) => {
    const id = req.query.newid;
    const name = req.query.newName;
    const salary = req.query.newSalary;
    const dept_name = req.query.newDept;

    const sqlQuery = `
    SELECT * FROM ${tables.tableNames.department} 
    WHERE ${tables.deptColumns.deptName} = ? COLLATE NOCASE`;

    const sqlQuery1 = `
    UPDATE ${tables.tableNames.instructor} 
    SET id = '${id}', name= '${name}', salary= ${salary}, department_name= '${dept_name}'
    WHERE ${tables.instructorColumns.id} = ?`

    const sqlQuery2 = `
    UPDATE ${tables.tableNames.student} 
    SET instructor_id = '${id}'
    WHERE ${tables.studentColumns.instructor_id} = ?`

    const sqlQuery3 = `
    UPDATE ${tables.tableNames.teaches}
    SET instructor_id = ${id}
    WHERE ${tables.teachesColumns.instructor_id} = ?;`

    db.get(sqlQuery, [dept_name], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "A department with the requested name was not found. Sorry! " + req.query.Dept_name
            });
        }
        db.run(sqlQuery1, [req.params.id], (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to update this instructor"+req.params.id
            });
        }
        })
        db.run(sqlQuery2, [req.params.id], (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to updating the student"+req.params.name+" "+deptName
            });
        }
        })
        db.run(sqlQuery3, [req.params.id], (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to updating the student"+req.params.name+" "+deptName
            });
        }
        res.redirect("/instructors");
        })
    });
})

module.exports = router;
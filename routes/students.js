const express = require('express');
const router = express.Router();
const db = require('../db/database').getDatabase();
const tables = require('../db/tables');
const { validateStudent } = require('../db/models');

router.get("/", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.student}`;
    db.all(sqlQuery, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/students.ejs", { students: rows });
    });
});

router.get("/create", function (req, res) {
    res.render("../FrontEnd/createStudent.ejs");
});

router.post("/", (req, res) => {
    const { error } = validateStudent(req.body);
    if (error) {
        return res.status(400).send({
            message: error.details[0].message
        });
    }

    const iname = req.body.name;
    const icreds = req.body.total_credits;
    const idept = req.body.department_name;
    const inst_id = req.body.instructor_id;

    if(inst_id !== ''){
        const sqlQuery = `
        INSERT INTO ${tables.tableNames.student}
        (name, total_credits, instructor_id, department_name)
        VALUES ('${iname}', ${icreds}, '${inst_id}', '${idept}')`;

        const sqlQuery1 = `SELECT * FROM ${tables.tableNames.department} WHERE ${tables.deptColumns.deptName} = ? COLLATE NOCASE`;
        const sqlQuery2 = `SELECT * FROM ${tables.tableNames.instructor} WHERE ${tables.instructorColumns.id} = ?`;
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
            res.redirect("/students");
        });
    
        });
        });
    }
    else{
        const sqlQuery = `
        INSERT INTO ${tables.tableNames.student}
        (name, total_credits, department_name)
        VALUES ('${iname}', ${icreds}, '${idept}')`;
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
                    message: "An error occured while trying to save the student details"
                });
            }
            res.redirect("/students");
        });
        });
    }
    
});

router.get("/search", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.student} WHERE ${tables.studentColumns.id} = ?`;
    db.get(sqlQuery, [req.query.student_id], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        if (!rows) {
            return res.status(404).send({
                message: "A student with the requested ID was not found." + req.query.student_id
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/studentById.ejs", { student: rows });
    });
});

router.get("/:id/advisor", (req, res) => {
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
                message: "An instructor with the requested ID was not found." + req.params.inst_id
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
                message: "A department with the requested name was not found. Sorry! " + req.params.name
            });
        }
        // res.send(rows);
        res.render("../FrontEnd/departmentByName.ejs", { department: rows });
    });
});

router.post("/:id/delete", (req, res) => {
    const sqlQuery = `
    DELETE FROM ${tables.tableNames.student}
    WHERE ${tables.studentColumns.id} == ?`

    db.run(sqlQuery, [req.params.id], (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to delete this student."
            });
        }
        return res.redirect("/students");
    });
});

router.get("/:id/update",(req,res) => {
    console.log("UPDATE");
    const sqlQuery = `SELECT * FROM ${tables.tableNames.student} WHERE ${tables.studentColumns.id} = ?`;
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
        res.render("../FrontEnd/studentupdate.ejs", { student: rows });
    });
})

router.get("/:id/updating",(req,res) => {
    const id = req.query.newid;
    const name = req.query.newName;
    const total_credits = req.query.newCredits;
    const inst_id = req.query.newInst_id;
    const dept_name = req.query.newDept;

    const sqlQuery = `
    UPDATE ${tables.tableNames.student} 
    SET id = '${id}', name= '${name}', total_credits= ${total_credits}, department_name= '${dept_name}', instructor_id = '${inst_id}'
    WHERE ${tables.studentColumns.id} = ?`

    if(dept_name === ''){
        return res.status(500).send({
                message: "An error occurred while trying to update this student "+req.params.id
            });
    }
    else{
        const sqlQuery1 = `SELECT * FROM ${tables.tableNames.department} WHERE ${tables.deptColumns.deptName} = ? COLLATE NOCASE`;
        const sqlQuery2 = `SELECT * FROM ${tables.tableNames.instructor} WHERE ${tables.instructorColumns.id} = ?`;
        db.get(sqlQuery1, [dept_name], (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "An error occurred"
                });
            }
            if (!rows) {
                return res.status(404).send({
                    message: "A department with the requested name was not found. Sorry! " + dept_name
                });
            }
            if(inst_id!==''){
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
                        db.run(sqlQuery, [req.params.id],(err) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send({
                                message: "An error occured while trying to save the student details"
                            });
                        }
                        console.log("1")
                        res.redirect("/students");
                    });
                
                    });
        }
        else{
            db.run(sqlQuery,[req.params.id], (err) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send({
                                message: "An error occured while trying to save the student details"
                            });
                        }
                        console.log("2")
                        res.redirect("/students");
                    });
                
        }
        });
    }

})

module.exports = router;
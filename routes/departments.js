const router = require('express').Router();
const tables = require('../db/tables');
const db = require('../db/database').getDatabase();
const { validateDepartment } = require('../db/models');

router.get("/", (req, res) => {
    const sqlQuery = `SELECT * FROM ${tables.tableNames.department}`;
    db.all(sqlQuery, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occurred"
            });
        }
        res.render("../FrontEnd/departments.ejs", { departments: rows });
    });
});

router.get("/create", (req, res) => {
    res.render('../FrontEnd/createDepartment.ejs');
});

router.post("/", (req, res) => {
    console.log("Request to post department received.")
    const { error } = validateDepartment(req.body);
    if (error) {
        return res.status(400).send({
            message: error.details[0].message
        });
    }

    const deptName = req.body.deptName;
    const building = req.body.building;
    const budget = req.body.budget;
    const sqlQuery = `
    INSERT INTO ${tables.tableNames.department}
    (deptName, building, budget)
    VALUES ('${deptName}', '${building}', ${budget})`

    db.run(sqlQuery, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "An error occured while trying to save the department details"
            });
        }
        res.redirect("/departments");
    });
});

router.get("/search", (req, res) => {
    // Adding COLLATE NOCASE makes the queries case insensitive.
    const sqlQuery = `SELECT * FROM ${tables.tableNames.department} WHERE ${tables.deptColumns.deptName} = ? COLLATE NOCASE`;
    db.get(sqlQuery, [req.query.Dept_name], (err, rows) => {
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
});

router.get("/:name/update",(req,res) => {
    console.log("UPDATE");
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
        res.render("../FrontEnd/deptupdate.ejs", { department: rows });
    });
})

router.get("/:name/updating",(req,res) => {
    const deptName = req.query.newdept;
    const building = req.query.newbuilding;
    const budget = req.query.newbudget;

    const sqlQuery1 = `
    UPDATE ${tables.tableNames.department} 
    SET deptName = '${deptName}', building= '${building}', budget= ${budget}
    WHERE ${tables.deptColumns.deptName} = ?
    COLLATE NOCASE`

    db.run(sqlQuery1, [req.params.name], (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to updating this department"+req.params.name+" "+deptName
                +" "+building+" "+budget
            });
        }
    })

    const sqlQuery2 = `
    UPDATE ${tables.tableNames.student} 
    SET department_name = '${deptName}'
    WHERE ${tables.studentColumns.department_name} = ?
    COLLATE NOCASE`

    db.run(sqlQuery2, [req.params.name], (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to updating the student"+req.params.name+" "+deptName
            });
        }
    })

    const sqlQuery3 = `
    UPDATE ${tables.tableNames.instructor} 
    SET department_name = '${deptName}'
    WHERE ${tables.studentColumns.department_name} = ?
    COLLATE NOCASE`

    db.run(sqlQuery3, [req.params.name], (err) => {
        if (err) {
            return res.status(500).send({
                message: "An error occurred while trying to updating the instructor"+req.params.name+" "+deptName
            });
        }
        res.redirect("/departments");
    })

})

router.post("/:name/delete", (req, res) => {
    const inst_id = ''
    const sqlQuery = `
        UPDATE ${tables.tableNames.student} 
        SET ${tables.studentColumns.instructor_id} = '${inst_id}'
        WHERE ${tables.studentColumns.instructor_id} = 
        (SELECT ${tables.instructorColumns.id}
        FROM ${tables.tableNames.instructor}
        WHERE ${tables.instructorColumns.department_name} = ?
        COLLATE NOCASE)`

    db.run(sqlQuery, [req.params.name], (err) => {
        if (err) {
            return res.status(500).send({
                message: "1.An error occurred while trying to delete this department"
            });
        }
    })

    const sqlQuery1 = `
    DELETE FROM ${tables.tableNames.department}
    WHERE ${tables.deptColumns.deptName} = ?
    COLLATE NOCASE`

    db.run(sqlQuery1, [req.params.name], (err) => {
        if (err) {
            return res.status(500).send({
                message: "2.An error occurred while trying to delete this department"
            });
        }
    })

    const sqlQuery2 = `
    DELETE FROM ${tables.tableNames.instructor}
    WHERE ${tables.instructorColumns.department_name} = ?
    COLLATE NOCASE`

    db.run(sqlQuery2, [req.params.name], (err) => {
        if (err) {
            return res.status(500).send({
                message: "3.An error occurred while trying to delete this department"
            });
        }
    })

    const sqlQuery3 = `
    DELETE FROM ${tables.tableNames.student}
    WHERE ${tables.studentColumns.department_name} = ?
    COLLATE NOCASE`

    db.run(sqlQuery3, [req.params.name], (err) => {
        if (err) {
            return res.status(500).send({
                message: "4.An error occurred while trying to delete this department"
            });
        }
    })

    const sqlQuery4 = `
    DELETE FROM ${tables.tableNames.teaches} 
    WHERE ${tables.teachesColumns.instructor_id} IN
        (SELECT ${tables.instructorColumns.id} 
        FROM ${tables.tableNames.instructor} 
        WHERE ${tables.instructorColumns.department_name} = ?
        COLLATE NOCASE);`

    db.run(sqlQuery4, [req.params.name], (err) => {
        if (err) {
            return res.status(500).send({
                message: "4.An error occurred while trying to delete this department"
            });
        }
        res.redirect("/departments");
    })
})

module.exports = router;

















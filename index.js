const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require("cors")
const route = process.env.PORT || 3000;

// import firebase-admin package
const admin = require('firebase-admin');

// import service account file (helps to know the firebase project details)
const serviceAccount = require("./serviceAccountKey.json");

// Intialize the firebase-admin project/account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

app.get("/status", (_req, res) => {
    res.send("ckeck Status");
});

app.post("/users/create", async (req, res) => {
  const { firstName, lastName, contactNumber, admin : isAdmin, email, password } = req.body

  try {
    admin.auth().createUser({
      email: email, 
      password: password,
      displayName: `${firstName} ${lastName}`
    })
      .then((result) => {
        admin.firestore().collection("profiles").doc().set({
          firstName: firstName,
          lastName: lastName,
          contactNumber: contactNumber,
          walkthrough: true,
          onboarding: true,
          profileId: result.uid,
          admin: isAdmin == "false" ? false : true
        })
          .then((_result) => {
            res.json({
              message: "Successfully created new account"
            })
          })
          .catch((err) => {
            console.error(err)
            res.status(400).json({
              message: error
            })
          })
      })
      .catch((err) => {
        console.error(err)
            res.status(400).json({
              message: error
            })
      })
  } catch (error) {
    console.error(error)
    res.status(400).json({
      message: error
    })
  }

})

app.get("/users", (_req, res) => {
  admin.auth().listUsers()
    .then(async (result) => {
      const users = await Promise.all(result.users.map(async (user) => {
        const userFromDB = await admin.firestore().collection("profiles").where("profileId", "==",user.uid).get()
        let d = {}

        userFromDB.forEach((doc) => {
          const singleUser = doc.data()
          
          d = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            disabled: user.disabled,
            admin: singleUser.admin ?? false,
            firstName: singleUser.firstName,
            lastName: singleUser.lastName
          }
        })

        return d
      }))

      res.json({
        result: users
      })
    })
    .catch((error) => {
      console.error(error)
      res.json({
        message: error
      })
    })
})

app.post("/edit", async (req, res) => {
  const { uid, firstName, lastName, contactNumber, admin : isAdmin } = req.body;

  try {
    const snapshot = await admin.firestore().collection("profiles").where("profileId", "==", uid).get();
    snapshot.forEach((doc) => {
      admin.firestore().collection("profiles").doc(doc.id).set({
        firstName: firstName, 
        lastName: lastName, 
        contactNumber: contactNumber,
        admin: isAdmin === "true" ? true : false,
      }, {
        merge: true
      })
        .then(() => {
          res.status(200).json({
            message: "Successfully updated user profile"
          })
        })
        .catch((error) => {
          console.error(error);
          res.status(400).json({
            message: error
          })
        })
    })
  } catch (error) {
    console.error(error);
  }
})

app.delete("/delete/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    admin.auth().deleteUser(uid)
      .then(async () => {
        const snapshot = await admin.firestore().collection("profiles").where("profileId", "==", uid).get();
        snapshot.forEach((doc) => {
          admin.firestore().collection("profiles").doc(doc.id).delete()
            .then(() => console.log("DELETED"))
            .catch((error) => {
              console.error(error);
              res.status(400).json({
                message: error
              })
            })
        })
        res.status(200).json({
          message: "User successfully deleted"
        })
      })
      .catch((error) => {
        res.status(400).json({
          message: error
        })
      })
  } catch (error) {
    res.status(400).json({
      message: error
    })
  }
})

app.patch("/enable", (req, res) => {
  const { uid } = req.body;

  admin.auth().updateUser(uid, {
    disabled: false,
  })
    .then(() => {
      res.status(200).json({
        message: "Successfully enabled user account",
      });
    })
    .catch((error) => {
      res.status(400).json({
        message: error
      });
    })
})

app.patch("/disable", (req, res) => {
  const { uid } = req.body;

  admin.auth().updateUser(uid, {
    disabled: true,
  })
    .then(() => {
      res.status(200).json({
        message: "Successfully disabled user account",
      });
    })
    .catch((error) => {
      res.status(400).json({
        message: error
      });
    })
})

app.listen(route, () => console.log(`Server running at port ${route}`))

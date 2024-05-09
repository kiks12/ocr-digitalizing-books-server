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

app.post("/edit", async (req, res) => {
  const { uid, firstName, lastName, contactNumber } = req.body;

  try {
    const snapshot = await admin.firestore().collection("profiles").where("profileId", "==", uid).get();
    snapshot.forEach((doc) => {
      admin.firestore().collection("profiles").doc(doc.id).update({
        firstName: firstName, 
        lastName: lastName, 
        contactNumber: contactNumber,
      })
        .then(() => {
          res.status(200).json({
            message: "Successfully updated user profile"
          })
        })
        .catch((error) => {
          console.error(error);
          res.status(400).json({
            error: error
          })
        })
    })
  } catch (error) {

  }
})

app.delete("/delete", async (req, res) => {
  const { uid } = req.body;

  try {
    const snapshot = await admin.firestore().collection("profiles").where("profileId", "==", uid).get();
    snapshot.forEach((doc) => {
      admin.firestore().collection("profiles").doc(doc.id).delete()
        .then(() => {
          admin.auth().deleteUser(uid)
            .then(() => {
              res.status(200).json({
                message: "User successfully deleted"
              })
            })
            .catch((error) => {
              res.status(400).json({
                error: error
              })
            }) 
        })
        .catch((error) => {
          console.error(error);
        })
    })
  } catch (error) {
    res.status(400).json({
      error: error
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

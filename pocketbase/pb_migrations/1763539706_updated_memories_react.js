/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3457331630")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date179083332",
    "max": "",
    "min": "",
    "name": "date",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3457331630")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date179083332",
    "max": "",
    "min": "",
    "name": "Date",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})

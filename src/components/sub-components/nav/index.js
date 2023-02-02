import React, { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useHistory } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { formatDateHoyEn, formatDateMananaEn } from "../../dates/dates";
import Dropdown from "react-bootstrap/Dropdown";
import Swal from "sweetalert2";
import "boxicons";
import "../../../css/nav.css";
import { url_api } from "../../../lib/data/server";

function Navg({ socket }) {
  let obH = JSON.parse(localStorage.getItem("permissions")).obviarIngreso;
  let am = JSON.parse(localStorage.getItem("permissions")).aprobarMovimientos;
  const history = useHistory();
  const [apertura, setApertura] = useState();
  const [moves, setMoves] = useState([]);
  const [filterMove, setfilterMove] = useState([]);
  const [note, setNote] = useState([])
  const [cierre, setCierre] = useState();
  const user = localStorage.getItem("name");
  let hourD = localStorage.getItem("HourAlert");
  const [alertDado, setAlertDado] = useState(hourD);
  const [aproveN, setAproveN] = useState([])
  const [notification, setNotification] = useState([]);
  const toggleFunc = () => {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("close");
    const navDiv = document.querySelector(".navDiv");
    navDiv.classList.toggle("close");
  };
  /*const ap = ( time < 12) ? "<span>AM</span>":"<span>PM</span>";*/
  let hoy_cierre;
  if (cierre < apertura) {
    hoy_cierre = `${formatDateMananaEn(new Date())} ${cierre}`; // 2022-10-26T20:00
  } else {
    hoy_cierre = `${formatDateHoyEn(new Date())} ${cierre}`; // 2022-10-25T20:00
  }

  let horaActual;
  let horaProgramadaAlert;
  let horaProgramada;
  function hourAlerta() {
    horaActual = new Date();
    horaProgramada = new Date(hoy_cierre);
    horaProgramadaAlert = new Date(hoy_cierre);
    horaProgramadaAlert.setMinutes(horaProgramadaAlert.getMinutes() - 5);
    if (
      horaProgramadaAlert - horaActual <= 0 &&
      localStorage.getItem("HourAlert") === "false" &&
      horaProgramada - horaActual > 0 &&
      !obH
    ) {
      localStorage.setItem("HourAlert", true);
      hourD = localStorage.getItem("HourAlert");
      setAlertDado(hourD);
      return alert("estamos a 5 minutos de cerrar");
    } else if (horaProgramada - horaActual <= 0 && !obH) {
      history.push("/logout");
    }
  }
  useEffect (() => {
    let n = 3600;
    const id = window.setInterval(function(){
      document.onmousemove = function (){
        n=3600
      }
      n--;
      let nav = localStorage.getItem('nav')
      if (n <= -1 && nav === "true") {
        Swal.fire({
          title: 'La sesion ha expirado',
          icon: 'warning',
          confirmButtonText: 'ok!'
        }).then((result) => {
          history.push('/logout')
        })
      }
    }, 1200)
  }, [])

  window.onmousemove = function () {
    hourAlerta();
  };

  const getNote = async () => {

    await fetch(`${url_api}/users/`).then(res => res.json()).then(res => res.users).then(res => res.filter((dato) => {
        return dato.email.includes(localStorage.getItem("email"))
      })
    ).then(res => res[0].notificaciones).then(res => setNote(res))
  } 

  const actNote = async (n) => {
    let updateData = {email: n.email, notificaciones: [n.message]}
    await fetch(`${url_api}/users/actNotificaciones`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    headers: new Headers({ 'Content-type': 'application/json'})
    }).then(getNote())
  } 

  useEffect(() => {
    if (am) {
      socket.on("move", getMoves);
    }
    socket.emit("join_room", parseInt(localStorage.getItem("messageID")))
    socket.on("receive_aprove", (data) => {
      setAproveN(prevArray => [...prevArray, data.message])
      getNote()
      actNote(data)
    })
  });
  
  useEffect(() => {
    setfilterMove(
      moves.filter((m) => {
        return !m.vale && !m.disabled;
      })
    );
  }, [moves]);
  const getMoves = async () => {
    const response = await fetch(`${url_api}/moves`);
    let data = await response.json();
    await setMoves(data);
  };

  useEffect(() => {
    getTime();
    getMoves();
    getNote()
  }, []);

  const getTime = async () => {
    await fetch(`${url_api}/dates/`)
      .then((r) => r.json())
      .then((r) => {
        setApertura(r.apertura);
        setCierre(r.cierre);
      });
  };

  const displayNotificationMove = (n) => {
    if (am) {
      if (filterMove.length > 0 && filterMove.length > 1) {
        return (
          <div onClick={() => history.push("/moves")} className="af" key={1}>
            {`Hay ${filterMove.length} movimientos por aprobar`}
          </div>
        );
      } else if (filterMove.length === 1) {
        return (
          <div onClick={() => history.push("/moves")} key={1}>
            {`Hay 1 movimiento por aprobar`}
          </div>
        );
      } else {
        return <div>No hay movimientos por aprobar</div>;
      }
    }
  };

  const displayNotes = () => {
    if (!note[0]) {
      if(am) {
        return false
      } else {
        return <div>No hay notificaciones nuevas</div> 
      }

    } else {
      return (
        <div onClick={() => history.push("/moves")} className="af" key={1}>
          {`Tienes movimientos ya aprobados`}
        </div>
      );
    }
  }

  return (
    <div className="ndG">
      <Navbar bg="light" expand="lg" className="topbar">
        <Container className="d-flex justify-content-center">
          <Row className="row-edit">
            <Col xs={2}>
              <Navbar.Brand href="#home">Toyoxpress</Navbar.Brand>
            </Col>
            <Col xs={5}>
              <div onClick={toggleFunc}>
                <Button variant="dark">
                  <box-icon name="menu" color="white" id="hola"></box-icon>
                </Button>{" "}
              </div>
            </Col>
            <Col xs={5}>
              <Nav className="me-auto row">
                <div className="notificacion col-2">
                  {filterMove.length > 0 && am ? (
                    <div className="bola " id="bola">
                      {filterMove.length}
                    </div>
                  ) : (
                    false
                  )}{!note[0] ? false : <div className="bola " id="bola">
                </div>}
                  <div class="dropdown col-3 d-flex justify-content-end">
                    <div
                      className="nav-link dropdown-toggle"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {" "}
                      <box-icon name="bell" className="campana"></box-icon>
                    </div>

                    <ul
                      class="dropdown-menu dropdown-menu-lg-start
                    mdw"
                    >
                      <li className="row">
                        {displayNotificationMove(notification)
                        }
                        {displayNotes()}
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="dropdown col-3 d-flex justify-content-end">
                  <a
                    className="nav-link dropdown-toggle"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {user}
                  </a>
                  <ul class="dropdown-menu dropdown-menu-lg-start">
                    <li className="row">
                      <div className="col-11 d-flex justify-content-center">
                        Hora de ingreso:
                      </div>
                      <div className="fw-semibold d-flex justify-content-center">
                        {apertura}
                      </div>
                    </li>
                    <li className="row">
                      <div className="col-11 d-flex justify-content-center">
                        Hora de Cierre:
                      </div>
                      <div className="fw-semibold d-flex justify-content-center">
                        {cierre}
                      </div>
                    </li>
                  </ul>
                </div>
              </Nav>
            </Col>
          </Row>
        </Container>
      </Navbar>
    </div>
  );
}

export default Navg;

import React from "react";
import styled from "styled-components"

const Image = (props) => {

    const {shape, src, size} = props;
    const styles = {
        src :src,
        size: size,
    }

    if(shape === "circle"){
        return (
            <ImageCircle {...styles}></ImageCircle>
        )
    }

    if(shape === "rectangle"){
        return (
            <AspecOutter>
                <AspecInner {...styles}></AspecInner>
            </AspecOutter>
        )
    }

    return(
        <React.Fragment>

        </React.Fragment>
    )

}

Image.defaultProps = {
    shape: "circle",
    src: "http://t1.daumcdn.net/movie/92323f5bc322b709e2605cc5406f5349ba4304d6",
    size: 36,
};

const AspecOutter = styled.div`
    width: 100%;
    min-width: 250px;
`;
const AspecInner = styled.div`
    position: relative;
    padding-top: 75%;
    overflow: hidden;
    background-image: url("${(props) => props.src}");
    background-size: cover;
`;

const ImageCircle = styled.div`
    --size: ${(props) => props.size}px;
    width: var(--size);
    height: var(--size);
    border-radius: var(--size);

    background-image: url("${(props)=>props.src}");
    background-size: cover;
    margin: 4px;
`;


export default Image;